import { ValidationError } from './errors.js';

type ValidatorFn<T> = (value: unknown) => value is T;

interface ValidationRule<T = unknown> {
  required?: boolean;
  validator?: ValidatorFn<T>;
  message?: string;
}

interface ValidationSchema {
  [key: string]: ValidationRule;
}

const isString = (value: unknown): value is string => typeof value === 'string';
const isNumber = (value: unknown): value is number => typeof value === 'number' && !isNaN(value);
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
const isInteger = (value: unknown): value is number => isNumber(value) && Number.isInteger(value);
const isPositiveNumber = (value: unknown): value is number => isNumber(value) && value > 0;
const isEmail = (value: unknown): value is string =>
  isString(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isNonEmptyString = (value: unknown): value is string =>
  isString(value) && value.trim().length > 0;

export const validators = {
  isString,
  isNumber,
  isBoolean,
  isInteger,
  isPositiveNumber,
  isEmail,
  isNonEmptyString,
};

export const validate = <T extends Record<string, unknown>>(
  data: unknown,
  schema: ValidationSchema
): T => {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('请求数据格式错误');
  }

  const errors: Record<string, string> = {};
  const validatedData = data as Record<string, unknown>;

  for (const [field, rule] of Object.entries(schema)) {
    const value = validatedData[field];

    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[field] = rule.message || `${field} 是必填项`;
      continue;
    }

    if (value !== undefined && value !== null && value !== '' && rule.validator) {
      if (!rule.validator(value)) {
        errors[field] = rule.message || `${field} 格式不正确`;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('数据验证失败', errors);
  }

  return validatedData as T;
};

export const validateParams = (params: Record<string, string>, expected: string[]): number[] => {
  const result: number[] = [];
  const errors: Record<string, string> = {};

  for (const param of expected) {
    const value = params[param];
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      errors[param] = `${param} 必须是有效数字`;
    } else {
      result.push(num);
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('参数验证失败', errors);
  }

  return result;
};

export const schemas = {
  login: {
    username: { required: true, validator: isNonEmptyString, message: '用户名不能为空' },
    password: { required: true, validator: isNonEmptyString, message: '密码不能为空' },
  } as ValidationSchema,

  register: {
    username: { required: true, validator: isNonEmptyString, message: '用户名不能为空' },
    email: { required: true, validator: isEmail, message: '邮箱格式不正确' },
    password: { required: true, validator: isNonEmptyString, message: '密码不能为空' },
    confirmPassword: { required: true, validator: isNonEmptyString, message: '确认密码不能为空' },
  } as ValidationSchema,

  createHabit: {
    name: { required: true, validator: isNonEmptyString, message: '习惯名称不能为空' },
    icon: { required: true, validator: isNonEmptyString, message: '图标不能为空' },
    color: { required: true, validator: isNonEmptyString, message: '颜色不能为空' },
    frequency: {
      required: true,
      validator: (v: unknown): v is 'daily' | 'weekly' =>
        v === 'daily' || v === 'weekly',
      message: '频率必须是 daily 或 weekly',
    },
    targetDays: { required: true, validator: isPositiveNumber, message: '目标天数必须是正数' },
  } as ValidationSchema,

  updateHabit: {
    name: { validator: isNonEmptyString, message: '习惯名称不能为空' },
    icon: { validator: isNonEmptyString, message: '图标不能为空' },
    color: { validator: isNonEmptyString, message: '颜色不能为空' },
    frequency: {
      validator: (v: unknown): v is 'daily' | 'weekly' =>
        v === 'daily' || v === 'weekly',
      message: '频率必须是 daily 或 weekly',
    },
    targetDays: { validator: isPositiveNumber, message: '目标天数必须是正数' },
  } as ValidationSchema,

  checkin: {
    habitId: { required: true, validator: isPositiveNumber, message: '习惯ID必须是正数' },
    date: { required: true, validator: isNonEmptyString, message: '日期不能为空' },
  } as ValidationSchema,

  updateDiary: {
    mood: { validator: isString, message: '心情格式不正确' },
    notes: { validator: isString, message: '备注格式不正确' },
  } as ValidationSchema,

  undoCheckin: {
    habitId: { required: true, validator: isPositiveNumber, message: '习惯ID必须是正数' },
    date: { required: true, validator: isNonEmptyString, message: '日期不能为空' },
  } as ValidationSchema,

  createTeam: {
    name: { required: true, validator: isNonEmptyString, message: '团队名称不能为空' },
    description: { required: true, validator: isNonEmptyString, message: '团队描述不能为空' },
  } as ValidationSchema,

  joinTeam: {
    inviteCode: { required: true, validator: isNonEmptyString, message: '邀请码不能为空' },
  } as ValidationSchema,
};
