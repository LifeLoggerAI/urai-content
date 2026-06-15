export function setNodeEnvForTests(value: string | undefined): void {
  if (value === undefined) {
    Reflect.deleteProperty(process.env, 'NODE_ENV');
    return;
  }

  Reflect.set(process.env, 'NODE_ENV', value);
}
