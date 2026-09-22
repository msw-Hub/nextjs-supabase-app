import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Flat config는 .eslintignore를 읽지 않으므로 빌드 산출물을 직접 제외해야 한다
  {
    ignores: [".next/**", "node_modules/**", "out/**", "build/**"],
  },
  // eslint-config-prettier는 항상 마지막에 위치해야 포맷 관련 규칙 충돌을 덮어쓴다
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
];

export default eslintConfig;
