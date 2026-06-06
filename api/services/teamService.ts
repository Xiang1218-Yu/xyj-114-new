import type { ApiResponse, Team, TeamMember } from '../../shared/types';
import { teamRepository } from '../repositories/teamRepository';
import { userRepository } from '../repositories/userRepository';

const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const teamService = {
  createTeam(userId: number, name: string, description: string): ApiResponse<Team> {
    if (!name || name.trim() === '') {
      return { success: false, message: '队伍名称不能为空' };
    }

    const user = userRepository.findById(userId);
    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    let inviteCode: string;
    let attempts = 0;
    do {
      inviteCode = generateInviteCode();
      attempts++;
    } while (teamRepository.findByInviteCode(inviteCode) && attempts < 10);

    if (attempts >= 10) {
      return { success: false, message: '生成邀请码失败，请重试' };
    }

    const teamId = teamRepository.createTeam(name, description, inviteCode, userId);
    teamRepository.addTeamMember(teamId, userId);

    const team = teamRepository.getTeamById(teamId);
    if (!team) {
      return { success: false, message: '创建队伍失败' };
    }

    return {
      success: true,
      data: team,
      message: '队伍创建成功',
    };
  },

  getTeams(userId: number): ApiResponse<Team[]> {
    const teams = teamRepository.getTeamsByUserId(userId);

    return {
      success: true,
      data: teams,
    };
  },

  getTeamDetail(teamId: number, userId: number): ApiResponse<Team> {
    const team = teamRepository.getTeamById(teamId);
    if (!team) {
      return { success: false, message: '队伍不存在' };
    }

    if (!teamRepository.isTeamMember(teamId, userId)) {
      return { success: false, message: '无权限查看此队伍' };
    }

    return {
      success: true,
      data: team,
    };
  },

  joinTeam(userId: number, inviteCode: string): ApiResponse<Team> {
    if (!inviteCode || inviteCode.trim() === '') {
      return { success: false, message: '邀请码不能为空' };
    }

    const team = teamRepository.findByInviteCode(inviteCode.toUpperCase());
    if (!team) {
      return { success: false, message: '邀请码无效' };
    }

    if (teamRepository.isTeamMember(team.id, userId)) {
      return { success: false, message: '您已加入此队伍' };
    }

    teamRepository.addTeamMember(team.id, userId);

    const updatedTeam = teamRepository.getTeamById(team.id);
    if (!updatedTeam) {
      return { success: false, message: '加入队伍失败' };
    }

    return {
      success: true,
      data: updatedTeam,
      message: '加入队伍成功',
    };
  },

  getTeamMembers(teamId: number, userId: number): ApiResponse<TeamMember[]> {
    const team = teamRepository.getTeamById(teamId);
    if (!team) {
      return { success: false, message: '队伍不存在' };
    }

    if (!teamRepository.isTeamMember(teamId, userId)) {
      return { success: false, message: '无权限查看此队伍成员' };
    }

    const members = teamRepository.getTeamMembers(teamId);

    return {
      success: true,
      data: members,
    };
  },
};
