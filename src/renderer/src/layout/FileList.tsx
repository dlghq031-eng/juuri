import { useState } from 'react'
import { FilePlus, Search } from 'lucide-react'

const DUMMY_FILES = [
  {
    id: '1',
    title: '나의 첫 번째 노트',
    preview: '오늘은 juuri 앱 개발을 시작하는 날이다. 설레는 마음으로 첫 문장을 적는다.',
    date: '오늘',
    wordCount: 312,
  },
  {
    id: '2',
    title: '아이디어 모음',
    preview: '1. 다크 모드 색상 팔레트 개선 2. 타자기 모드에서 환경음 효과 추가',
    date: '어제',
    wordCount: 89,
  },
  {
    id: '3',
    title: '독서 기록 — 파친코',
    preview: '이민진 작가의 파친코. 4대에 걸친 재일 교포 가족의 이야기를 다룬다.',
    date: '4월 19일',
    wordCount: 1204,
  },
  {
    id: '4',
    title: '주간 회고',
    preview: '이번 주에 잘한 것, 아쉬운 것, 다음 주 목표를 정리해보자.',
    date: '4월 18일',
    wordCount: 445,
  },
  {
    id: '5',
    title: '여행 계획 — 제주도',
    preview: '5월 연휴 제주도 여행. 렌터카 예약 필요. 성산일출봉은 꼭 가봐야지.',
    date: '4월 15일',
    wordCount: 230,
  },
]

export default function FileList(): React.JSX.Element {
  const [activeId, setActiveId] = useState('1')
  const [query, setQuery] = useState('')

  const filtered = DUMMY_FILES.filter((f) =>
    f.title.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="w-[260px] h-full flex flex-col bg-[#1c1c1e] border-r border-white/[0.05] shrink-0">
      {/* 헤더 */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <span className="text-white font-semibold text-[13px]">일기</span>
        <button className="p-1 rounded-md text-[#666670] hover:text-white hover:bg-white/[0.07] transition-colors">
          <FilePlus size={15} />
        </button>
      </div>

      {/* 검색창 */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 px-2.5 py-[7px] rounded-lg bg-white/[0.04] border border-white/[0.07]">
          <Search size={12} className="text-[#555558] shrink-0" />
          <input
            type="text"
            placeholder="검색..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-[12px] text-[#a0a0a5] placeholder-[#3e3e42] outline-none"
          />
        </div>
      </div>

      {/* 파일 목록 */}
      <ul className="flex-1 overflow-y-auto px-2 py-1 space-y-px">
        {filtered.map((file) => (
          <li key={file.id}>
            <button
              onClick={() => setActiveId(file.id)}
              className={`w-full text-left px-3 py-[10px] rounded-lg transition-colors ${
                activeId === file.id ? 'bg-white/[0.07]' : 'hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-baseline justify-between gap-2 mb-[3px]">
                <span
                  className={`text-[13px] font-medium truncate ${
                    activeId === file.id ? 'text-white' : 'text-[#b0b0b8]'
                  }`}
                >
                  {file.title}
                </span>
                <span className="text-[10px] text-[#3e3e42] shrink-0">{file.date}</span>
              </div>
              <p className="text-[11px] text-[#4a4a50] leading-relaxed line-clamp-2">
                {file.preview}
              </p>
            </button>
          </li>
        ))}
      </ul>

      {/* 하단 카운트 */}
      <div className="px-4 py-2 border-t border-white/[0.05]">
        <span className="text-[10px] text-[#3a3a3e]">{filtered.length}개의 노트</span>
      </div>
    </div>
  )
}
