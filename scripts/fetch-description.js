'use strict';

const axios = require('axios');
const cheerio = require('cheerio');

const TIMEOUT = 12000;
const MAX_CHARS = 400;
const MAX_CONCURRENCY = 3;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9',
};

function truncate(text) {
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS);
}

async function fetchSaraminDescription(url) {
  const response = await axios.get(url, {
    headers: { ...HEADERS, Accept: 'text/html' },
    timeout: TIMEOUT,
    maxRedirects: 5,
  });
  const $ = cheerio.load(response.data);

  // 담당업무 / 자격요건 섹션 우선 추출
  const sections = [];
  $('.jv_summary .item_tit').each((_, el) => {
    const label = $(el).text().trim();
    if (['담당업무', '주요업무', '자격요건', '업무내용'].some((k) => label.includes(k))) {
      const content = $(el).next('.item_cont').text().trim();
      if (content) sections.push(`[${label}] ${content}`);
    }
  });
  if (sections.length > 0) return truncate(sections.join(' '));

  // fallback: 전체 상세 내용
  const fallback = $('.wrap_jv_cont').text() || $('.jv_detail').text() || '';
  return truncate(fallback) || null;
}

async function fetchJobkoreaDescription(url) {
  const response = await axios.get(url, {
    headers: { ...HEADERS, Accept: 'text/html' },
    timeout: TIMEOUT,
  });
  const $ = cheerio.load(response.data);

  // 담당업무 / 자격요건 테이블 행 우선 추출
  const sections = [];
  $('th').each((_, el) => {
    const label = $(el).text().trim();
    if (['담당업무', '주요업무', '자격요건', '직무내용'].some((k) => label.includes(k))) {
      const content = $(el).closest('tr').find('td').text().trim();
      if (content) sections.push(`[${label}] ${content}`);
    }
  });
  if (sections.length > 0) return truncate(sections.join(' '));

  // fallback
  const fallback =
    $('.re_detail').text() ||
    $('[class*="JobSummary"]').text() ||
    $('[class*="job_summary"]').text() ||
    '';
  return truncate(fallback) || null;
}

async function fetchWantedDescription(url) {
  const idMatch = url.match(/\/wd\/(\d+)/);
  if (!idMatch) return null;

  const response = await axios.get(
    `https://www.wanted.co.kr/api/v4/jobs/${idMatch[1]}`,
    {
      headers: { ...HEADERS, Accept: 'application/json' },
      timeout: TIMEOUT,
    }
  );
  const detail = response.data?.job?.detail ?? {};
  const parts = [detail.main_tasks, detail.requirements, detail.intro].filter(Boolean);
  return truncate(parts.join(' ')) || null;
}

async function fetchJasoseolDescription(url) {
  const idMatch = url.match(/\/recruit\/(\d+)/);
  if (!idMatch) return null;

  const response = await axios.get(
    `https://jasoseol.com/api/v1/employment_companies/${idMatch[1]}`,
    {
      headers: { ...HEADERS, Accept: 'application/json' },
      timeout: TIMEOUT,
    }
  );
  const job = response.data ?? {};
  const text = job.description || job.content || job.body || job.detail || '';
  return truncate(text) || null;
}

async function fetchDescription(item) {
  try {
    switch (item.source) {
      case 'saramin':
      case 'saramin-sch':
        return await fetchSaraminDescription(item.url);
      case 'jobkorea':
        return await fetchJobkoreaDescription(item.url);
      case 'wanted':
        return await fetchWantedDescription(item.url);
      case 'jasoseol':
        return await fetchJasoseolDescription(item.url);
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * 여러 아이템의 description을 병렬(최대 MAX_CONCURRENCY)로 fetch
 * 각 item에 .description 필드를 직접 추가
 */
async function fetchDescriptions(items) {
  for (let i = 0; i < items.length; i += MAX_CONCURRENCY) {
    const batch = items.slice(i, i + MAX_CONCURRENCY);
    await Promise.all(
      batch.map(async (item) => {
        item.description = await fetchDescription(item);
      })
    );
  }
}

module.exports = { fetchDescriptions };
