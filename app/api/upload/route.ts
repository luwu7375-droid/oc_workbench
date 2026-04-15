import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const characterId = formData.get('characterId') as string

    if (!file || !characterId) {
      return NextResponse.json({ error: '缺少文件或角色 ID' }, { status: 400 })
    }

    // 简化版：直接返回 data URL（base64）
    // 生产环境应该上传到 Supabase Storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    return NextResponse.json({ data: { url: dataUrl }, error: null })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
}
