'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ItemType } from '@prisma/client'

type ImportMode = 'content' | 'narrative'

export function ImportForm() {
  const router = useRouter()
  const [mode, setMode] = useState<ImportMode>('content')
  const [text, setText] = useState('')
  const [itemType, setItemType] = useState<ItemType>('snippet')
  const [loading, setLoading] = useState(false)

  async function handleContentImport() {
    const lines = text.split('\n').filter((l) => l.trim())
    const results: string[] = []
    let errorCount = 0

    for (const line of lines) {
      try {
        // 支持两种格式：
        // 1. "角色A,角色B\t片段内容"
        // 2. "#角色A #角色B 片段内容"
        let characterNames: string[] = []
        let content: string = ''

        if (line.includes('\t')) {
          const [names, ...rest] = line.split('\t')
          characterNames = names.split(',').map((n) => n.trim()).filter(Boolean)
          content = rest.join('\t').trim()
        } else {
          const hashtagMatches = line.match(/#(\S+)/g)
          if (hashtagMatches) {
            characterNames = hashtagMatches.map((h) => h.slice(1))
            content = line.replace(/#\S+/g, '').trim()
          } else {
            // 没有角色标记，跳过
            errorCount++
            continue
          }
        }

        if (!content || characterNames.length === 0) {
          errorCount++
          continue
        }

        // 查找或创建角色
        const characterIds: string[] = []
        const newCharacters: string[] = []
        const existingCharacters: string[] = []

        for (const name of characterNames) {
          const searchRes = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: name }),
          })
          const searchJson = await searchRes.json()

          let characterId: string
          const existingChar = searchJson.data?.characters?.find(
            (c: any) => c.name.toLowerCase() === name.toLowerCase()
          )

          if (existingChar) {
            characterId = existingChar.id
            existingCharacters.push(name)
          } else {
            // 创建新角色
            const createRes = await fetch('/api/characters', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name }),
            })
            const createJson = await createRes.json()
            if (createJson.error) {
              errorCount++
              continue
            }
            characterId = createJson.data.id
            newCharacters.push(name)
          }
          characterIds.push(characterId)
        }

        // 创建内容项
        const itemRes = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            itemType,
            characterIds,
          }),
        })
        const itemJson = await itemRes.json()
        if (itemJson.error) {
          errorCount++
        } else {
          // 生成成功消息
          if (newCharacters.length > 0 && existingCharacters.length > 0) {
            results.push(`已新增角色 ${newCharacters.join('、')}，为 ${characterNames.join('、')} 新增一条记录`)
          } else if (newCharacters.length > 0) {
            results.push(`已新增角色 ${newCharacters.join('、')}，新增一条记录`)
          } else {
            results.push(`为 ${existingCharacters.join('、')} 新增一条记录`)
          }
        }
      } catch {
        errorCount++
      }
    }

    return { results, errorCount }
  }

  async function handleNarrativeImport() {
    try {
      const res = await fetch('/api/import/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const json = await res.json()
      if (json.error) {
        toast.error(json.error)
        return { results: [], errorCount: 1 }
      }
      const results = [
        `已识别 ${json.data.charactersCreated} 个角色，创建 ${json.data.itemsCreated} 条片段`
      ]
      return { results, errorCount: 0 }
    } catch {
      toast.error('导入失败')
      return { results: [], errorCount: 1 }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) {
      toast.error('请输入内容')
      return
    }

    setLoading(true)
    const result = mode === 'content'
      ? await handleContentImport()
      : await handleNarrativeImport()
    setLoading(false)

    if (result.results.length > 0) {
      // 显示详细的成功消息
      result.results.forEach((msg) => toast.success(msg))
      if (result.errorCount > 0) {
        toast.error(`${result.errorCount} 条导入失败`)
      }
      router.push('/')
      router.refresh()
    } else {
      toast.error('导入失败')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">导入模式</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('content')}
            className={`flex-1 px-4 py-3 rounded-lg border text-sm transition-colors ${
              mode === 'content'
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <div className="font-medium mb-1">内容导入</div>
            <div className="text-xs opacity-80">批量导入片段，自动关联角色</div>
          </button>
          <button
            type="button"
            onClick={() => setMode('narrative')}
            className={`flex-1 px-4 py-3 rounded-lg border text-sm transition-colors ${
              mode === 'narrative'
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <div className="font-medium mb-1">剧情导入</div>
            <div className="text-xs opacity-80">AI 自动提取角色和片段</div>
          </button>
        </div>
      </div>

      {mode === 'content' && (
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">内容类型</label>
          <div className="flex gap-2">
            {(['snippet', 'reference'] as ItemType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setItemType(type)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  itemType === type
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {type === 'snippet' ? '创作片段' : '摘抄参考'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          {mode === 'content' ? '内容' : '剧情文本'}
        </label>
        <div className="text-xs text-zinc-500 mb-2">
          {mode === 'content' ? (
            <>
              每行一条，支持两种格式：
              <br />
              1. <code className="bg-zinc-100 px-1 rounded">角色A,角色B[Tab]片段内容</code>
              <br />
              2. <code className="bg-zinc-100 px-1 rounded">#角色A #角色B 片段内容</code>
            </>
          ) : (
            '粘贴完整剧情，AI 将自动识别角色并拆分片段'
          )}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={mode === 'content' ? 12 : 16}
          placeholder={
            mode === 'content'
              ? '角色A,角色B\t他们在咖啡厅相遇了\n#角色C 独自在家思考人生'
              : '粘贴剧情文本...'
          }
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-400 font-mono resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !text.trim()}
        className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
      >
        {loading ? '导入中...' : '开始导入'}
      </button>
    </form>
  )
}
