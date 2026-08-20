import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "아이디 또는 이메일을 입력해 주세요."),
  password: z.string().min(1, "비밀번호를 입력해 주세요."),
});

export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "이름을 입력해 주세요.")
      .max(50, "이름은 50자 이하로 입력해 주세요."),
    email: z.string().email("이메일 형식을 확인해 주세요."),
    password: z
      .string()
      .min(8, "비밀번호는 8자 이상이어야 합니다.")
      .max(64, "비밀번호는 64자 이하로 입력해 주세요.")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d).+$/,
        "비밀번호는 영문과 숫자를 함께 포함해야 합니다.",
      ),
    passwordConfirm: z.string().min(1, "비밀번호를 다시 입력해 주세요."),
    phone: z
      .string()
      .trim()
      .max(20, "휴대전화 번호는 20자 이하로 입력해 주세요.")
      .optional(),
  })
  .refine((value) => value.password === value.passwordConfirm, {
    message: "비밀번호가 서로 일치하지 않습니다.",
    path: ["passwordConfirm"],
  });

export function getFirstValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "입력하신 정보를 다시 확인해 주세요.";
}
