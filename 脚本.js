function main(config) {
  // ========================================
  // 1. 清理信息节点（非真实代理节点）
  // ========================================
  const infoKeywords = [
    '剩余流量', '距离下次', '套餐到期', '官网', '邮箱',
    '订阅时效', '节点异常', '重新导入', '重登账号'
  ];

  if (config.proxies) {
    const originalCount = config.proxies.length;
    config.proxies = config.proxies.filter(proxy => {
      return !infoKeywords.some(keyword => proxy.name.includes(keyword));
    });
    console.log(`✓ 已过滤 ${originalCount - config.proxies.length} 个信息节点`);
  }

  // ========================================
  // 2. 优化代理组配置
  // ========================================
  if (config["proxy-groups"]) {
    config["proxy-groups"].forEach(group => {
      // 从代理组中移除信息节点
      if (group.proxies) {
        group.proxies = group.proxies.filter(proxyName => {
          return !infoKeywords.some(keyword => proxyName.includes(keyword));
        });
      }

      // 优化自动选择组
      if (group.type === 'url-test') {
        group.interval = 300; // 5分钟测试一次
        group['lazy'] = true; // 启用懒加载
        group['tolerance'] = 50; // 延迟容差50ms
        group['unified-delay'] = true; // 使用统一延迟测试
        console.log(`✓ 优化自动选择组: ${group.name}`);
      }

      // 优化故障转移组
      if (group.type === 'fallback') {
        group.interval = 600; // 10分钟测试一次
        group['lazy'] = true;
        group['tolerance'] = 100;
        console.log(`✓ 优化故障转移组: ${group.name}`);
      }
    });
  }

  // ========================================
  // 3. 自动获取主代理组名称
  // ========================================
  const proxyGroupName = config["proxy-groups"]?.find(g =>
    ["节点选择", "Proxy", "🚀 节点选择", "选择节点", "代理", "Candytally", /糖果云/].some(pattern =>
      pattern instanceof RegExp ? pattern.test(g.name) : g.name.includes(pattern)
    )
  )?.name || config["proxy-groups"]?.[0]?.name || "PROXY";

  console.log(`✓ 使用代理组: ${proxyGroupName}`);

  // ========================================
  // 4. 游戏优化规则
  // ========================================
  const gameRules = [
    // LOL/腾讯游戏 (强制直连)
    "PROCESS-NAME,League of Legends.exe,DIRECT",
    "PROCESS-NAME,LeagueClient.exe,DIRECT",
    "PROCESS-NAME,LeagueClientUx.exe,DIRECT",
    "PROCESS-NAME,LeagueClientUxRender.exe,DIRECT",
    "PROCESS-NAME,TenioDL.exe,DIRECT",
    "PROCESS-NAME,CrossProxy.exe,DIRECT",
    "PROCESS-NAME,TenSafe.exe,DIRECT",
    "PROCESS-NAME,Tencentdl.exe,DIRECT",
    "PROCESS-NAME,WeGame.exe,DIRECT",
    "PROCESS-NAME,WeGameHelper.exe,DIRECT",
    "PROCESS-NAME,WeGameLauncher.exe,DIRECT",
    "DOMAIN-SUFFIX,lol.qq.com,DIRECT",
    "DOMAIN-KEYWORD,lol-game,DIRECT",
    "DOMAIN-SUFFIX,tgp.qq.com,DIRECT",

    // Steam 下载/CDN (直连)
    "DOMAIN-SUFFIX,steamcontent.com,DIRECT",
    "DOMAIN-SUFFIX,steamserver.net,DIRECT",
    "DOMAIN-SUFFIX,steambroadcast.akamaized.net,DIRECT",
    "DOMAIN-SUFFIX,steamuserimages-a.akamaihd.net,DIRECT",
    "DOMAIN-KEYWORD,steam-cdn,DIRECT",
    "DOMAIN-KEYWORD,steampipe,DIRECT",

    // Steam 商店/社区 (代理)
    `DOMAIN-SUFFIX,steampowered.com,${proxyGroupName}`,
    `DOMAIN-SUFFIX,steamstatic.com,${proxyGroupName}`,
    `DOMAIN-SUFFIX,steam-chat.com,${proxyGroupName}`,
    `DOMAIN-SUFFIX,steamgames.com,${proxyGroupName}`,
    `DOMAIN-SUFFIX,steamusercontent.com,${proxyGroupName}`,
    `DOMAIN-SUFFIX,help.steampowered.com,${proxyGroupName}`
  ];

  // ========================================
  // 5. AI 服务规则 (代理)
  // ========================================
  const aiRules = [
    `DOMAIN-SUFFIX,openai.com,${proxyGroupName}`,
    `DOMAIN-SUFFIX,anthropic.com,${proxyGroupName}`,
    `DOMAIN-SUFFIX,claude.ai,${proxyGroupName}`,
    `DOMAIN-KEYWORD,chatgpt,${proxyGroupName}`,
    `DOMAIN-SUFFIX,ai.com,${proxyGroupName}`,
    `DOMAIN-SUFFIX,perplexity.ai,${proxyGroupName}`,
    `DOMAIN-SUFFIX,gemini.google.com,${proxyGroupName}`
  ];

  // ========================================
  // 6. 清理重复规则
  // ========================================
  if (!config.rules) {
    config.rules = [];
  }

  // 移除冲突的 Apple 规则（保留代理优先）
  const conflictDomains = ['itunes.apple.com', 'edgekey.net'];
  config.rules = config.rules.filter((rule, index) => {
    const isDuplicate = conflictDomains.some(domain =>
      rule.includes(domain) && rule.includes('DIRECT')
    );
    if (isDuplicate) {
      console.log(`✓ 移除冲突规则: ${rule}`);
    }
    return !isDuplicate;
  });

  // 去重（保留第一次出现的规则）
  const ruleSet = new Set();
  const originalRuleCount = config.rules.length;
  config.rules = config.rules.filter(rule => {
    const normalized = rule.trim();
    if (ruleSet.has(normalized)) {
      return false;
    }
    ruleSet.add(normalized);
    return true;
  });

  if (originalRuleCount !== config.rules.length) {
    console.log(`✓ 移除 ${originalRuleCount - config.rules.length} 条重复规则`);
  }

  // ========================================
  // 7. 插入优化规则（按优先级排序）
  // ========================================
  config.rules = [
    ...gameRules,
    ...aiRules,
    ...config.rules
  ];

  // ========================================
  // 8. DNS 优化
  // ========================================
  config.dns = {
    enable: true,
    ipv6: false,
    'enhanced-mode': 'fake-ip',
    'fake-ip-range': '198.18.0.1/16',
    'prefer-h3': true,

    // 精简 nameserver（只保留最快的）
    'default-nameserver': ['223.5.5.5', '119.29.29.29'],
    'nameserver': [
      'https://doh.pub/dns-query',
      'https://dns.alidns.com/dns-query'
    ],

    // 精简 fallback
    'fallback': [
      'https://1.1.1.1/dns-query',
      'https://8.8.8.8/dns-query'
    ],

    'fallback-filter': {
      geoip: true,
      'geoip-code': 'CN',
      ipcidr: ['240.0.0.0/4', '0.0.0.0/32']
    },

    // DNS 策略优化
    'nameserver-policy': {
      'geosite:cn': ['223.5.5.5', '119.29.29.29'],
      '*.steamcontent.com': ['223.5.5.5', '119.29.29.29'],
      '*.qq.com': ['223.5.5.5', '119.29.29.29'],
      '*.tencent.com': ['223.5.5.5', '119.29.29.29']
    },

    // fake-ip 过滤器（避免某些服务出问题）
    'fake-ip-filter': [
      '*.lan',
      '*.local',
      'localhost.ptlogin2.qq.com',
      '+.msftconnecttest.com',
      '+.msftncsi.com'
    ]
  };

  // ========================================
  // 9. 性能优化
  // ========================================
  config['unified-delay'] = true;
  config['tcp-concurrent'] = true;

  // ========================================
  // 10. 输出优化摘要
  // ========================================
  console.log('\n========== 配置优化完成 ==========');
  console.log(`代理节点数: ${config.proxies?.length || 0}`);
  console.log(`代理组数: ${config["proxy-groups"]?.length || 0}`);
  console.log(`规则数: ${config.rules?.length || 0}`);
  console.log(`主代理组: ${proxyGroupName}`);
  console.log('==================================\n');

  return config;
}