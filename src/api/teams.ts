import { createApiClient } from './client';
import type { Team, TeamMember, CreateTeamRequest, JoinTeamRequest } from '@shared/types';

const apiClient = createApiClient('/teams');

export const getTeams = () => apiClient.get<Team[]>();
export const createTeam = (data: CreateTeamRequest) => apiClient.post<Team>(data);
export const joinTeam = (data: JoinTeamRequest) => apiClient.post<Team>(data, '/join');
export const getTeamDetail = (id: number) => apiClient.get<Team>(`/${id}`);
export const getTeamMembers = (id: number) => apiClient.get<TeamMember[]>(`/${id}/members`);
