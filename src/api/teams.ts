import { request } from './client';
import type {
  Team,
  TeamMember,
  CreateTeamRequest,
  JoinTeamRequest,
  ApiResponse,
} from '@shared/types';

export const getTeams = (): Promise<ApiResponse<Team[]>> => {
  return request<Team[]>('get', '/teams');
};

export const createTeam = (data: CreateTeamRequest): Promise<ApiResponse<Team>> => {
  return request<Team>('post', '/teams', data);
};

export const joinTeam = (data: JoinTeamRequest): Promise<ApiResponse<Team>> => {
  return request<Team>('post', '/teams/join', data);
};

export const getTeamDetail = (id: number): Promise<ApiResponse<Team>> => {
  return request<Team>('get', `/teams/${id}`);
};

export const getTeamMembers = (id: number): Promise<ApiResponse<TeamMember[]>> => {
  return request<TeamMember[]>('get', `/teams/${id}/members`);
};
