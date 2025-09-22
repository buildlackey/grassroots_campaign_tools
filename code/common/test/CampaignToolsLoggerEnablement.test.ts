import * as fs from 'fs';
import * as path from 'path';

require('../src/CampaignToolsLogger');

const CONFIG_PATH = path.resolve(process.env.HOME || '', '.campaign/test-config.json');
let configBackup: string | null = null;
let originalGlobalLoggingFlag: any = undefined;

function getLoggingFlag(): boolean {
    let home = process.env.HOME;
    try {
        const homeDir = home || process.env.USERPROFILE;
        if (homeDir) {
            const configPath = path.resolve(homeDir, ".campaign", "test-config.json");
            if (fs.existsSync(configPath)) {
                const raw = fs.readFileSync(configPath, "utf8");
                if (raw.trim()) {
                    const config = JSON.parse(raw);
                    if (typeof config.CAMPAIGN_TOOLS_ENABLE_LOGGING !== "undefined") {
                        return !!config.CAMPAIGN_TOOLS_ENABLE_LOGGING;
                    }
                }
            }
        }
    } catch (e) {}
    return false;
}

describe('CampaignToolsLogger enablement via CAMPAIGN_TOOLS_ENABLE_LOGGING', () => {
  beforeAll(() => {
    if (fs.existsSync(CONFIG_PATH)) {
      configBackup = fs.readFileSync(CONFIG_PATH, 'utf8');
    }
    originalGlobalLoggingFlag = (globalThis as any).CAMPAIGN_TOOLS_ENABLE_LOGGING;
  });

  afterAll(() => {
    if (configBackup !== null) {
      fs.writeFileSync(CONFIG_PATH, configBackup, 'utf8');
    } else if (fs.existsSync(CONFIG_PATH)) {
      fs.unlinkSync(CONFIG_PATH);
    }
    if (typeof originalGlobalLoggingFlag !== 'undefined') {
      (globalThis as any).CAMPAIGN_TOOLS_ENABLE_LOGGING = originalGlobalLoggingFlag;
    } else {
      delete (globalThis as any).CAMPAIGN_TOOLS_ENABLE_LOGGING;
    }
  });

  beforeEach(() => {
    jest.resetModules();
  });

  it('should call log when config enables logging', () => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ CAMPAIGN_TOOLS_ENABLE_LOGGING: true }), 'utf8');
    (globalThis as any).CAMPAIGN_TOOLS_ENABLE_LOGGING = getLoggingFlag();
    expect(getLoggingFlag()).toBe(true);
    const logger = (globalThis as any).CAMPAIGN.CampaignToolsLogger.getInstance();

    console.log("1 Logger enabled state:", logger.getEnabled());

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    logger.log('test message');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should NOT call log when config disables logging', () => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ CAMPAIGN_TOOLS_ENABLE_LOGGING: false }), 'utf8');
    (globalThis as any).CAMPAIGN_TOOLS_ENABLE_LOGGING = getLoggingFlag();
    expect(getLoggingFlag()).toBe(false);
    const logger = (globalThis as any).CAMPAIGN.CampaignToolsLogger.getInstance();
    console.log("2 Logger enabled state:", logger.getEnabled());
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    logger.log('test message');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
