import { Building2, BookOpen } from 'lucide-react'

const catColor: Record<string, string> = {
  Robot:        'bg-blue-50 text-blue-700 border-blue-200',
  CV:           'bg-violet-50 text-violet-700 border-violet-200',
  'AI/ML':      'bg-green-50 text-green-700 border-green-200',
  Control:      'bg-orange-50 text-orange-700 border-orange-200',
  'CV & AI':    'bg-indigo-50 text-indigo-700 border-indigo-200',
  Mechatronics: 'bg-rose-50 text-rose-700 border-rose-200',
}

const conferences: { category: string; items: { name: string; fullName?: string; organizer: string[]; deadline: string; date: string }[] }[] = [
  {
    category: 'Robot',
    items: [
      { name: 'ICRA',                    fullName: 'International Conference on Robotics and Automation',                   organizer: ['IEEE RAS'],        deadline: '24.09.15', date: '25.05.19' },
      { name: 'RoboSoft',                fullName: 'IEEE International Conference on Soft Robotics',                        organizer: ['IEEE'],            deadline: '24.10.15', date: '25.04.23' },
      { name: 'RSS',                     fullName: 'Robotics: Science and Systems',                                         organizer: ['RSS Foundation'],  deadline: '25.01.24', date: '25.06.21' },
      { name: 'IROS',                    fullName: 'International Conference on Intelligent Robots and Systems',             organizer: ['IEEE RAS', 'RSJ'], deadline: '25.03.02', date: '25.10.19' },
      { name: 'CASE',                    fullName: 'IEEE International Conference on Automation Science and Engineering',    organizer: ['IEEE RAS'],        deadline: '25.03.15', date: '25.08.17' },
      { name: 'ICROS Annual Conference', fullName: undefined,                                                                organizer: ['ICROS'],           deadline: '25.04.18', date: '25.06.25' },
      { name: 'CoRL',                    fullName: 'Conference on Robot Learning',                                          organizer: ['IPAM'],            deadline: '25.04.28', date: '25.09.27' },
      { name: 'Humanoids',               fullName: 'IEEE-RAS International Conference on Humanoid Robots',                  organizer: ['IEEE RAS'],        deadline: '25.05.31', date: '25.09.30' },
      { name: 'ICCAS',                   fullName: 'International Conference on Control, Automation, and Systems',          organizer: ['ICROS'],           deadline: '25.05.31', date: '25.11.04' },
      { name: 'KRoC',                    fullName: '한국로봇종합학술대회',                                                    organizer: ['KROS'],            deadline: '25.08.29', date: '26.02.04' },
      { name: 'HRI',                     fullName: 'ACM/IEEE International Conference on Human-Robot Interaction',          organizer: ['ACM', 'IEEE RAS'], deadline: '25.09.30', date: '26.03.16' },
    ],
  },
  {
    category: 'CV',
    items: [
      { name: 'CVPR', fullName: 'Conference on Computer Vision and Pattern Recognition', organizer: ['IEEE CVF'], deadline: '24.11.08', date: '25.06.10' },
      { name: 'ICCV', fullName: 'International Conference on Computer Vision',           organizer: ['IEEE CVF'], deadline: '25.03.07', date: '25.10.19' },
      { name: 'ECCV', fullName: 'European Conference on Computer Vision',                organizer: ['ECVA'],     deadline: '26.03.05', date: '26.09.08' },
    ],
  },
  {
    category: 'AI/ML',
    items: [
      { name: 'ICLR',    fullName: 'International Conference on Learning Representations',  organizer: ['ICLR'],               deadline: '24.10.01', date: '25.04.24' },
      { name: 'ICML',    fullName: 'International Conference on Machine Learning',          organizer: ['IMLS'],               deadline: '25.01.31', date: '25.07.13' },
      { name: 'NeurIPS', fullName: 'Conference on Neural Information Processing Systems',   organizer: ['NeurIPS Foundation'], deadline: '25.05.15', date: '25.12.02' },
      { name: 'AAAI',    fullName: 'AAAI Conference on Artificial Intelligence',            organizer: ['AAAI'],               deadline: '25.08.01', date: '26.01.20' },
    ],
  },
  {
    category: 'Control',
    items: [
      { name: 'ACC', fullName: 'American Control Conference',             organizer: ['AACC'],     deadline: '24.10.02', date: '25.07.08' },
      { name: 'CDC', fullName: 'IEEE Conference on Decision and Control', organizer: ['IEEE CSS'], deadline: '25.03.31', date: '25.12.10' },
    ],
  },
]

const journals: { category: string; items: { name: string; fullName: string; organizer: string[]; freq: string; if_: string; index_: string; q_: string }[] }[] = [
  {
    category: 'Robot',
    items: [
      { name: 'Advanced Intelligent Systems', fullName: 'Advanced Intelligent Systems',                                organizer: ['Wiley'],            freq: '월간 (연 12회)',   if_: '6.1',  index_: 'SCIE', q_: 'Q1' },
      { name: 'Autonomous Robots',            fullName: 'Autonomous Robots',                                          organizer: ['Springer'],         freq: '격월간 (연 6회)', if_: '4.3',  index_: 'SCIE', q_: 'Q2' },
      { name: 'Bioinspiration & Biomimetics', fullName: 'Bioinspiration & Biomimetics',                               organizer: ['IOP Publishing'],   freq: '격월간 (연 6회)', if_: '3.2',  index_: 'SCIE', q_: 'Q1' },
      { name: 'Frontiers in Neurorobotics',   fullName: 'Frontiers in Neurorobotics',                                 organizer: ['Frontiers'],        freq: '수시 출판',        if_: '2.9',  index_: 'SCIE', q_: 'Q2' },
      { name: 'IEEE T-MRB',                   fullName: 'IEEE Transactions on Medical Robotics and Bionics',          organizer: ['IEEE RAS'],         freq: '분기별 (연 4회)', if_: '3.8',  index_: 'SCIE', q_: 'Q1' },
      { name: 'IJRR',                         fullName: 'The International Journal of Robotics Research',             organizer: ['SAGE Publications'],freq: '연 14회',         if_: '7.5',  index_: 'SCIE', q_: 'Q1' },
      { name: 'IJSR',                         fullName: 'International Journal of Social Robotics',                   organizer: ['Springer'],         freq: '격월간 (연 6회)', if_: '3.7',  index_: 'SCIE', q_: 'Q2' },
      { name: 'JIRS',                         fullName: 'Journal of Intelligent & Robotic Systems',                   organizer: ['Springer'],         freq: '격월간 (연 6회)', if_: '3.4',  index_: 'SCIE', q_: 'Q2' },
      { name: 'JMR',                          fullName: 'Journal of Mechanisms and Robotics',                         organizer: ['ASME'],             freq: '격월간 (연 6회)', if_: '3.3',  index_: 'SCIE', q_: 'Q1' },
      { name: 'Journal of Bionic Engineering',fullName: 'Journal of Bionic Engineering',                              organizer: ['Springer'],         freq: '격월간 (연 6회)', if_: '5.8',  index_: 'SCIE', q_: 'Q1' },
      { name: 'Journal of Field Robotics',    fullName: 'Journal of Field Robotics',                                  organizer: ['Wiley'],            freq: '격월간 (연 6회)', if_: '7.2',  index_: 'SCIE', q_: 'Q1' },
      { name: 'Mechatronics',                 fullName: 'Mechatronics',                                               organizer: ['Elsevier'],         freq: '월간 (연 12회)',   if_: '3.1',  index_: 'SCIE', q_: 'Q1' },
      { name: 'RA-L',                         fullName: 'IEEE Robotics and Automation Letters',                        organizer: ['IEEE RAS'],         freq: '분기별 (연 4회)', if_: '6.3',  index_: 'SCIE', q_: 'Q1' },
      { name: 'RAS',                          fullName: 'Robotics and Autonomous Systems',                            organizer: ['Elsevier'],         freq: '월간 (연 12회)',   if_: '6.9',  index_: 'SCIE', q_: 'Q1' },
      { name: 'RCIM',                         fullName: 'Robotics and Computer-Integrated Manufacturing',             organizer: ['Elsevier'],         freq: '격월간 (연 6회)', if_: '15.4', index_: 'SCIE', q_: 'Q1' },
      { name: 'Science Robotics',             fullName: 'Science Robotics',                                          organizer: ['AAAS'],             freq: '월간 (연 12회)',   if_: '26.4', index_: 'SCIE', q_: 'Q1' },
      { name: 'Soft Robotics',                fullName: 'Soft Robotics',                                             organizer: ['Mary Ann Liebert'], freq: '수시 출판',        if_: '7.9',  index_: 'SCIE', q_: 'Q1' },
      { name: 'T-RO',                         fullName: 'IEEE Transactions on Robotics',                              organizer: ['IEEE RAS'],         freq: '격월간 (연 6회)', if_: '10.5', index_: 'SCIE', q_: 'Q1' },
    ],
  },
  {
    category: 'CV & AI',
    items: [
      { name: 'TPAMI', fullName: 'IEEE Transactions on Pattern Analysis and Machine Intelligence', organizer: ['IEEE Computer Society'], freq: '월간 (연 12회)', if_: '17.9', index_: 'SCIE', q_: 'Q1' },
    ],
  },
  {
    category: 'CV',
    items: [
      { name: 'IJCV', fullName: 'International Journal of Computer Vision', organizer: ['Springer'], freq: '월간 (연 12회)', if_: '11.6', index_: 'SCIE', q_: 'Q1' },
    ],
  },
  {
    category: 'AI/ML',
    items: [
      { name: 'JMLR',  fullName: 'Journal of Machine Learning Research',                      organizer: ['JMLR'],     freq: '수시 출판',     if_: '6.7',  index_: 'SCIE', q_: 'Q1' },
      { name: 'TNNLS', fullName: 'IEEE Transactions on Neural Networks and Learning Systems', organizer: ['IEEE CIS'], freq: '월간 (연 12회)', if_: '11.7', index_: 'SCIE', q_: 'Q1' },
    ],
  },
  {
    category: 'Control',
    items: [
      { name: 'Automatica', fullName: 'Automatica',                                                organizer: ['IFAC'],     freq: '월간 (연 12회)', if_: '6.7', index_: 'SCIE', q_: 'Q1' },
      { name: 'IEEE TAC',   fullName: 'Transactions on Automatic Control',                        organizer: ['IEEE CSS'], freq: '월간 (연 12회)', if_: '7.4', index_: 'SCIE', q_: 'Q1' },
      { name: 'IJCAS',      fullName: 'International Journal of Control, Automation and Systems', organizer: ['ICROS'],    freq: '월간 (연 12회)', if_: '3.3', index_: 'SCIE', q_: 'Q2' },
    ],
  },
  {
    category: 'Mechatronics',
    items: [
      { name: 'Control Engineering Practice', fullName: 'Control Engineering Practice',                            organizer: ['Elsevier', 'IFAC'], freq: '월간 (연 12회)',   if_: '4.9',  index_: 'SCIE', q_: 'Q1' },
      { name: 'IEEE T-HMS',                   fullName: 'IEEE Transactions on Human-Machine Systems',              organizer: ['IEEE SMC'],         freq: '격월간 (연 6회)', if_: '4.4',  index_: 'SCIE', q_: 'Q2' },
      { name: 'IEEE T-IE',                    fullName: 'IEEE Transactions on Industrial Electronics',             organizer: ['IEEE IES'],         freq: '월간 (연 12회)',   if_: '9.7',  index_: 'SCIE', q_: 'Q1' },
      { name: 'IEEE T-ITS',                   fullName: 'IEEE Transactions on Intelligent Transportation Systems', organizer: ['IEEE ITSS'],        freq: '월간 (연 12회)',   if_: '11.5', index_: 'SCIE', q_: 'Q1' },
      { name: 'T-ASE',                        fullName: 'IEEE Transactions on Automation Science and Engineering', organizer: ['IEEE RAS'],         freq: '분기별 (연 4회)', if_: '9.4',  index_: 'SCIE', q_: 'Q1' },
      { name: 'TMECH',                        fullName: 'IEEE/ASME Transactions on Mechatronics',                  organizer: ['IEEE', 'ASME'],     freq: '격월간 (연 6회)', if_: '9.0',  index_: 'SCIE', q_: 'Q1' },
    ],
  },
]

export default function ConferencesTab() {
  return (
    <div className="space-y-8">

      {/* ── 학회 ── */}
      <section>
        <h3 className="text-base font-bold text-primary flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5" /> 학회
        </h3>
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-bg-light border-b border-border">
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted w-16">분야</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted">이름</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted">주관</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted whitespace-nowrap">제출 마감일</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted whitespace-nowrap">개최일</th>
              </tr>
            </thead>
            <tbody>
              {conferences.flatMap((group) =>
                group.items.map((item, i) => (
                  <tr key={item.name} className="border-b border-border last:border-0 hover:bg-bg-light/50 transition-colors">
                    {i === 0 && (
                      <td
                        rowSpan={group.items.length}
                        className={`px-3 py-2 align-middle text-center border-r border-border`}
                      >
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${catColor[group.category] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {group.category}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-2.5 align-middle">
                      <span className="font-semibold text-primary">{item.name}</span>
                      {item.fullName && (
                        <div className="text-[10px] text-text-light leading-relaxed mt-0.5">{item.fullName}</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 align-middle text-text-muted">
                      {item.organizer.map((o) => (
                        <div key={o}>{o}</div>
                      ))}
                    </td>
                    <td className="px-4 py-2.5 align-middle text-text-muted font-mono">{item.deadline}</td>
                    <td className="px-4 py-2.5 align-middle text-text-muted font-mono">{item.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 저널 ── */}
      <section>
        <h3 className="text-base font-bold text-primary flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5" /> 저널
        </h3>
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-bg-light border-b border-border">
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted w-16">분야</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted">이름</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted">주관</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted whitespace-nowrap">발행 주기</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted">IF</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted whitespace-nowrap">등재지</th>
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted whitespace-nowrap">Q등급</th>
              </tr>
            </thead>
            <tbody>
              {journals.flatMap((group) =>
                group.items.map((item, i) => (
                  <tr key={item.name} className="border-b border-border last:border-0 hover:bg-bg-light/50 transition-colors">
                    {i === 0 && (
                      <td
                        rowSpan={group.items.length}
                        className="px-3 py-2 align-middle text-center border-r border-border"
                      >
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${catColor[group.category] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {group.category}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-2.5 align-middle">
                      <span className="font-semibold text-primary">{item.name}</span>
                      {item.name !== item.fullName && (
                        <div className="text-[10px] text-text-light leading-relaxed mt-0.5">{item.fullName}</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 align-middle text-text-muted">
                      {item.organizer.map((o) => (
                        <div key={o}>{o}</div>
                      ))}
                    </td>
                    <td className="px-4 py-2.5 align-middle text-text-muted whitespace-nowrap">{item.freq}</td>
                    <td className="px-4 py-2.5 align-middle font-mono font-semibold text-accent-industry whitespace-nowrap">{item.if_}</td>
                    <td className="px-4 py-2.5 align-middle">
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded border bg-sky-50 text-sky-700 border-sky-200">{item.index_}</span>
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${item.q_ === 'Q1' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{item.q_}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  )
}
