import { log } from '../../utils/logger';
export class SkillMcpManager {
    registry = new Map();
    connections = new Map();
    register(skillName, serverName, config) {
        const key = `${skillName}:${serverName}`;
        this.registry.set(key, { skillName, serverName, config });
        log('[skill-mcp] registered', { skillName, serverName, type: config.command ? 'stdio' : 'http' });
    }
    unregister(skillName, serverName) {
        const key = `${skillName}:${serverName}`;
        this.registry.delete(key);
        this.disconnect(skillName, serverName);
    }
    async connect(skillName, serverName) {
        const key = `${skillName}:${serverName}`;
        const entry = this.registry.get(key);
        if (!entry) {
            return { skillName, serverName, status: 'error', error: 'Not registered' };
        }
        const conn = {
            skillName,
            serverName,
            status: 'connecting',
        };
        this.connections.set(key, conn);
        try {
            if (entry.config.command) {
                conn.status = 'connected';
                conn.tools = await this.discoverStdioTools(entry.config);
            }
            else if (entry.config.url) {
                conn.status = 'connected';
                conn.tools = await this.discoverHttpTools(entry.config);
            }
            else {
                conn.status = 'error';
                conn.error = 'No command or URL configured';
            }
        }
        catch (err) {
            conn.status = 'error';
            conn.error = String(err);
            log('[skill-mcp] connection failed', { skillName, serverName, error: conn.error });
        }
        log('[skill-mcp] connected', { skillName, serverName, status: conn.status, toolCount: conn.tools?.length });
        return conn;
    }
    disconnect(skillName, serverName) {
        const key = `${skillName}:${serverName}`;
        const conn = this.connections.get(key);
        if (conn) {
            conn.status = 'disconnected';
        }
        this.connections.delete(key);
    }
    disconnectAll(skillName) {
        for (const [key, conn] of this.connections) {
            if (conn.skillName === skillName) {
                conn.status = 'disconnected';
                this.connections.delete(key);
            }
        }
    }
    getConnection(skillName, serverName) {
        return this.connections.get(`${skillName}:${serverName}`);
    }
    getAllConnections() {
        return [...this.connections.values()];
    }
    getRegistry() {
        return [...this.registry.values()];
    }
    parseSkillMcpYaml(yaml, skillName) {
        const configs = [];
        const lines = yaml.split('\n');
        let current = null;
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('mcp:'))
                continue;
            if (trimmed.startsWith('- name:')) {
                if (current?.name)
                    configs.push(current);
                current = { name: trimmed.replace('- name:', '').trim() };
            }
            else if (current && trimmed.startsWith('command:')) {
                current.command = trimmed.replace('command:', '').trim();
            }
            else if (current && trimmed.startsWith('url:')) {
                current.url = trimmed.replace('url:', '').trim();
            }
            else if (current && trimmed.startsWith('args:')) {
                const argsStr = trimmed.replace('args:', '').trim();
                current.args = argsStr.startsWith('[')
                    ? JSON.parse(argsStr)
                    : argsStr.split(' ').filter(Boolean);
            }
        }
        if (current?.name)
            configs.push(current);
        log('[skill-mcp] parsed yaml', { skillName, serverCount: configs.length });
        return configs;
    }
    async discoverStdioTools(config) {
        try {
            const { spawn } = await import('node:child_process');
            return new Promise((resolve) => {
                const proc = spawn(config.command, config.args ?? [], {
                    env: { ...process.env, ...config.env },
                    timeout: 5000,
                });
                let output = '';
                proc.stdout?.on('data', (d) => (output += d.toString()));
                proc.stderr?.on('data', (d) => (output += d.toString()));
                proc.on('close', () => {
                    try {
                        const parsed = JSON.parse(output);
                        if (Array.isArray(parsed)) {
                            resolve(parsed.map((t) => t.name ?? t));
                        }
                        else if (parsed.tools) {
                            resolve(parsed.tools.map((t) => t.name));
                        }
                        else {
                            resolve([]);
                        }
                    }
                    catch {
                        resolve([]);
                    }
                });
                proc.on('error', () => resolve([]));
                setTimeout(() => {
                    proc.kill();
                    resolve([]);
                }, 5000);
            });
        }
        catch {
            return [];
        }
    }
    async discoverHttpTools(config) {
        try {
            const url = config.url;
            const toolsUrl = url.endsWith('/') ? `${url}tools` : `${url}/tools`;
            const resp = await fetch(toolsUrl, {
                headers: config.headers,
                signal: AbortSignal.timeout(5000),
            });
            if (!resp.ok)
                return [];
            const data = await resp.json();
            if (Array.isArray(data))
                return data.map((t) => t.name ?? t);
            if (data.tools)
                return data.tools.map((t) => t.name);
            return [];
        }
        catch {
            return [];
        }
    }
    dispose() {
        for (const conn of this.connections.values()) {
            conn.status = 'disconnected';
        }
        this.connections.clear();
        this.registry.clear();
    }
}
//# sourceMappingURL=index.js.map