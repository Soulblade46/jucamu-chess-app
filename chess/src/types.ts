export type Screen = 'home' | 'timer' | 'tournament' | 'participant'

export type Mode = 'round-robin' | 'swiss' | 'knockout'
export type Result = 'white' | 'black' | 'draw'

export interface Player {
  id: string
  name: string
  score: number
  buchholz: number
  wins: number
  draws: number
  losses: number
}

export interface Match {
  id: string
  round: number
  table: number
  white: string
  black: string
  result?: Result
  bye?: boolean
}

export interface Tournament {
  id: string
  name: string
  mode: Mode
  rounds: number
  players: Player[]
  matches: Match[]
  currentRound: number
  started: boolean
}
