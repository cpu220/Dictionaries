/**
 * 网络相关工具函数
 */

/**
 * 获取设备的局域网IP地址
 * 使用WebRTC API获取本地网络接口的IP地址
 * @returns Promise<string> 局域网IP地址
 */
export const getLocalIPAddress = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // 检查浏览器是否支持RTCPeerConnection
      if (!window.RTCPeerConnection) {
        throw new Error('RTCPeerConnection is not supported in this browser');
      }

      // 创建一个RTCPeerConnection实例
      const pc = new RTCPeerConnection({
        iceServers: [],
      });

      // 创建一个数据通道
      pc.createDataChannel('');

      // 存储所有找到的本地IP地址
      const foundIPs = new Set<string>();

      // 监听ICE候选事件，从中提取IP地址
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate.candidate;
          if (candidate) {
            console.log('ICE candidate:', candidate);
            // 解析ICE候选字符串，提取IP地址
            // 格式示例: "candidate:1 1 UDP 2130706431 192.168.1.100 53491 typ host"
            const match = candidate.match(/([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/);
            if (match && match[1]) {
              const ip = match[1];
              console.log('Extracted IP address:', ip);
              // 验证是否为局域网IP地址且不是回环地址
              if (isLocalIP(ip) && !isLoopbackIP(ip)) {
                foundIPs.add(ip);
                console.log('Found valid LAN IP:', ip);
              }
            }
          }
        } else {
          // 所有ICE候选都已生成
          console.log('All ICE candidates generated');
          console.log('Found IPs:', Array.from(foundIPs));
          
          // 筛选出非回环地址的局域网IP
          const lanIPs = Array.from(foundIPs).filter(ip => !isLoopbackIP(ip));
          
          if (lanIPs.length > 0) {
            // 返回第一个找到的局域网IP地址
            pc.close();
            resolve(lanIPs[0]);
          } else {
            pc.close();
            reject(new Error('No LAN IP address found'));
          }
        }
      };

      // 监听连接状态变化
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          // 如果连接失败但找到了IP地址，仍然返回第一个找到的IP
          const lanIPs = Array.from(foundIPs).filter(ip => !isLoopbackIP(ip));
          if (lanIPs.length > 0) {
            pc.close();
            resolve(lanIPs[0]);
          } else {
            pc.close();
            reject(new Error('Failed to get local IP address'));
          }
        }
      };

      // 创建一个offer，触发ICE候选生成
      pc.createOffer()
        .then((offer) => {
          console.log('Created offer:', offer);
          return pc.setLocalDescription(offer);
        })
        .catch((error) => {
          console.error('Error creating offer:', error);
          // 如果创建offer失败但找到了IP地址，仍然返回第一个找到的IP
          const lanIPs = Array.from(foundIPs).filter(ip => !isLoopbackIP(ip));
          if (lanIPs.length > 0) {
            pc.close();
            resolve(lanIPs[0]);
          } else {
            pc.close();
            reject(error);
          }
        });

      // 设置超时
      setTimeout(() => {
        console.log('Timeout reached, checking found IPs:', Array.from(foundIPs));
        const lanIPs = Array.from(foundIPs).filter(ip => !isLoopbackIP(ip));
        if (lanIPs.length > 0) {
          pc.close();
          resolve(lanIPs[0]);
        } else {
          pc.close();
          reject(new Error('Timeout: Failed to get local IP address'));
        }
      }, 5000);
    } catch (error) {
      console.error('Error in getLocalIPAddress:', error);
      reject(error);
    }
  });
};

/**
 * 检查IP地址是否为回环地址
 * @param ip IP地址
 * @returns boolean 是否为回环地址
 */
export const isLoopbackIP = (ip: string): boolean => {
  // 回环地址范围：127.0.0.0 - 127.255.255.255
  const parts = ip.split('.').map(Number);
  return parts.length === 4 && parts[0] === 127;
};

/**
 * 检查IP地址是否为局域网IP
 * @param ip IP地址
 * @returns boolean 是否为局域网IP
 */
export const isLocalIP = (ip: string): boolean => {
  // 局域网IP地址范围：
  // 10.0.0.0 - 10.255.255.255
  // 172.16.0.0 - 172.31.255.255
  // 192.168.0.0 - 192.168.255.255
  // 127.0.0.0 - 127.255.255.255 (回环地址)
  const parts = ip.split('.').map(Number);
  
  if (parts.length !== 4) {
    return false;
  }
  
  const [first, second] = parts;
  
  return (
    // 10.0.0.0/8
    (first === 10) ||
    // 172.16.0.0/12
    (first === 172 && second >= 16 && second <= 31) ||
    // 192.168.0.0/16
    (first === 192 && second === 168) ||
    // 127.0.0.0/8 (回环地址)
    (first === 127)
  );
};

/**
 * 获取设备的公网IP地址
 * 使用STUN服务器获取公网IP地址
 * @returns Promise<string> 公网IP地址
 */
export const getPublicIPAddress = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302',
        },
      ],
    });

    pc.createDataChannel('');

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate.candidate;
        if (candidate) {
          const match = candidate.match(/([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/);
          if (match && match[1]) {
            const ip = match[1];
            // 验证是否为公网IP地址
            if (!isLocalIP(ip)) {
              pc.close();
              resolve(ip);
            }
          }
        }
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        pc.close();
        reject(new Error('Failed to get public IP address'));
      }
    };

    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch((error) => {
        pc.close();
        reject(error);
      });
  });
};

/**
 * 生成随机端口号
 * @param min 最小端口号（默认1024）
 * @param max 最大端口号（默认65535）
 * @returns number 随机端口号
 */
export const generateRandomPort = (min: number = 1024, max: number = 65535): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
