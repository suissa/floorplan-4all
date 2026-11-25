// A generic, stdin/stdout-only agent fixture. It records argv and the task for integration tests,
// then returns the same JSON contract documented for third-party Floorplan adapters.
import fs from 'node:fs';

const args = process.argv.slice(2);
let prompt = '';
process.stdin.on('data', (chunk) => { prompt += chunk; });
process.stdin.on('end', () => {
  const promptArg = args.indexOf('--prompt');
  const task = promptArg < 0 ? prompt : String(args[promptArg + 1] || '');
  fs.appendFileSync(process.env.FAKE_LOG, JSON.stringify({ args, prompt: task }) + '\n');
  const question = /The question:\n([\s\S]*)$/.exec(task)?.[1] || '';
  console.log(JSON.stringify({
    title: 'Configured agent',
    answer: question ? 'Answered by the configured agent.' : 'No question was supplied.',
    items: [],
    steps: [],
    followups: ['Ask another question'],
  }));
});
