import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(() => {
  const repoName = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : 'Restaurant-management-system';
  const isUserSite = repoName.endsWith('.github.io');
  return {
    plugins: [react()],
    base: process.env.GITHUB_ACTIONS ? (isUserSite ? '/' : `/${repoName}/`) : '/',
  };
});
