import useModal from '@/components/Modal/useModal'
import { GAME_MARK, GAME_TITLE, GAME_VERSION } from '@/config/game'

function StartPage() {
  const { open: openLoadSave } = useModal(<p className="text-amber-300/60">暂未实现</p>, {
    title: '读取存档',
  })

  const { open: openSettings } = useModal(<p className="text-amber-300/60">暂未实现</p>, {
    title: '游戏设置',
  })

  return (
    <div className="flex h-full flex-col items-center justify-center gap-16 px-8">
      {/* 标题区 */}
      <div className="flex flex-col items-center gap-2">
        {GAME_TITLE && (
          <h1 className="text-4xl font-bold tracking-widest text-amber-300">{GAME_TITLE}</h1>
        )}
        {GAME_MARK && <p className="text-sm tracking-wider text-amber-300/60">{GAME_MARK}</p>}
        {GAME_VERSION && <p className="text-xs text-amber-300/40">v{GAME_VERSION}</p>}
      </div>

      {/* 按钮区 */}
      <div className="flex w-48 flex-col gap-3">
        <button className="w-full border border-amber-300/40 py-2.5 text-sm tracking-widest text-amber-300 transition-colors hover:border-amber-300 hover:bg-amber-300/10 pc:cursor-pointer">
          开始游戏
        </button>
        <button
          className="w-full border border-amber-300/40 py-2.5 text-sm tracking-widest text-amber-300 transition-colors hover:border-amber-300 hover:bg-amber-300/10 pc:cursor-pointer"
          onClick={openLoadSave}
        >
          读取存档
        </button>
        <button
          className="w-full border border-amber-300/40 py-2.5 text-sm tracking-widest text-amber-300 transition-colors hover:border-amber-300 hover:bg-amber-300/10 pc:cursor-pointer"
          onClick={openSettings}
        >
          游戏设置
        </button>
      </div>
    </div>
  )
}

export default StartPage
