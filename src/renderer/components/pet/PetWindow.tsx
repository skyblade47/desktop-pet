import { InkPet } from './InkPet'

interface PetWindowProps {
  onClick?: () => void
}

export function PetWindow({ onClick }: PetWindowProps) {
  return (
    <InkPet
      size="100vw"
      quality="auto"
      onClick={onClick}
      style={{ height: '100vh' }}
    />
  )
}
