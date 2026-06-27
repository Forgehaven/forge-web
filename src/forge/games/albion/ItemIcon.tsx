import { itemIconUrl } from '../../../utils/albionIcons'

export function ItemIcon({ uniqueName, size = 24, quality, className }: {
  uniqueName: string
  size?: number
  quality?: number
  className?: string
}) {
  return (
    <img
      src={itemIconUrl(uniqueName, size * 2, quality)}
      alt=""
      width={size}
      height={size}
      className={className}
      loading="lazy"
    />
  )
}
