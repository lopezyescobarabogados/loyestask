import type { Project, teamMember } from "../types"

export const isManager = (managerId: Project['manager'], userId: teamMember['_id']) => managerId === userId
