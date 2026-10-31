// Prueba con datos móviles: expone la API (puerto 3000) con tu ngrok y arranca Expo en modo túnel
// apuntando a esa URL pública. Requisitos: backend corriendo, `ngrok` con authtoken y `expo login`.
import { spawn } from 'node:child_process';

const API_PORT = process.env.API_PORT ?? '3000';
const shell = process.platform === 'win32';

const ngrok = spawn('ngrok', ['http', API_PORT, '--log=stdout'], { stdio: 'ignore', shell });
ngrok.on('error', () => fail('No encontré el comando `ngrok`. Instálalo y ejecuta `ngrok config add-authtoken <token>`.'));

function fail(msg) {
  console.error(msg);
  ngrok.kill();
  process.exit(1);
}

async function publicUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:4040/api/tunnels');
      const { tunnels } = await res.json();
      const https = tunnels.find((t) => t.public_url.startsWith('https://'));
      if (https) return https.public_url;
    } catch {
      // ngrok todavía no levanta su panel local
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}

const apiUrl = await publicUrl();
if (!apiUrl) fail('ngrok no abrió el túnel de la API. Revisa tu authtoken o si ya hay otra sesión de ngrok abierta.');
console.log(`\nAPI pública: ${apiUrl}\n`);

const expo = spawn('npx', ['expo', 'start', '--tunnel', '--clear'], {
  stdio: 'inherit',
  shell,
  env: { ...process.env, EXPO_PUBLIC_API_URL: apiUrl },
});
const stop = () => {
  ngrok.kill();
  expo.kill();
};
expo.on('exit', (code) => {
  ngrok.kill();
  process.exit(code ?? 0);
});
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
