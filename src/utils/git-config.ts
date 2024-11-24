export const GIT_CONFIG = [
  '-c', 'core.autocrlf=false',
  '-c', 'core.safecrlf=false',
  '-c', 'core.eol=lf',
  '-c', 'advice.statusHints=false',
  '-c', 'advice.statusUoption=false',
  '-c', 'core.fileMode=false'
].join(' ');

export const GIT_ENV = {
  GIT_TERMINAL_PROMPT: '0',
  GIT_ASKPASS: 'echo'
}; 