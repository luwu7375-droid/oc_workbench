'use client'
import { useState } from 'react'
import { StateCardDisplay } from './state-card-display'
import { StateCardForm } from './state-card-form'
import type { ItemWithCharacters } from '@/types'

export function StateCardSection({
  characterId,
  stateCard
}: {
  characterId: string
  stateCard?: ItemWithCharacters
}) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="mb-6">
      {stateCard ? (
        <StateCardDisplay
          item={stateCard}
          onEdit={() => setDialogOpen(true)}
        />
      ) : (
        <button
          onClick={() => setDialogOpen(true)}
          className="w-full rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-6 text-sm text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 transition-colors"
        >
          + 添加当前状态卡
        </button>
      )}

      <StateCardForm
        characterId={characterId}
        existingItem={stateCard}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
