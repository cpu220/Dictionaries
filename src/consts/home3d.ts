/**
 * 3D Home 页面配置常量
 */

/**
 * 星球相关配置
 */
export interface PlanetConfig {
  BASE_RADIUS: number;
  ROTATION_SPEED: number;
  ORBIT_RADIUS: number;
  ORBIT_ROTATION_SPEED: number;
  MAX_SATELLITES: number;
  SATELLITE_BASE_RADIUS: number;
  SATELLITE_RADIUS_INCREMENT: number;
  SATELLITE_RADIUS_VARIATION: number;
}

export const PLANET_CONFIG: PlanetConfig = {
  // 星球基础大小
  BASE_RADIUS: 0.3, // 减小默认大小，使星球在初始视角中可见
  
  // 星球旋转速度
  ROTATION_SPEED: 0.1, // 降低旋转速度，使视觉效果更舒适
  
  // 轨道半径（星球围绕中心点的距离）
  ORBIT_RADIUS: 2, // 默认轨道半径
  
  // 轨道旋转速度（星球围绕中心点旋转的速度）
  ORBIT_ROTATION_SPEED: 0.15, // 增加轨道旋转速度，使旋转效果更明显
  
  // 卫星生成配置
  MAX_SATELLITES: 2000, // 最大卫星数量
  SATELLITE_BASE_RADIUS: 0.5, // 卫星起始轨道半径
  SATELLITE_RADIUS_INCREMENT: 0.2, // 不同难度等级的轨道间距
  SATELLITE_RADIUS_VARIATION: 0.5, // 同一等级内的轨道半径随机波动范围
};

/**
 * 卫星相关配置
 */
export interface SatelliteConfig {
  SIZE: number;
  OPACITY_MAIN: number;
  OPACITY_GLOW: number;
  ORBIT_SPEED_MIN: number;
  ORBIT_SPEED_RANGE: number;
  SELF_ROTATION_SPEED: number;
  VERTICAL_WAVE_AMPLITUDE: number;
}

export const SATELLITE_CONFIG: SatelliteConfig = {
  // 卫星外观
  SIZE: 0.04, // 卫星大小
  OPACITY_MAIN: 0.7, // 主体透明度
  OPACITY_GLOW: 0.3, // 光晕透明度
  
  // 卫星运动配置
  ORBIT_SPEED_MIN: 0.3, // 最小公转速度
  ORBIT_SPEED_RANGE: 0.8, // 公转速度随机范围
  SELF_ROTATION_SPEED: 2, // 自转速度
  
  // 卫星高度变化幅度
  VERTICAL_WAVE_AMPLITUDE: 0.3,
};

/**
 * 场景相关配置
 */
export const SCENE_CONFIG = {
  // 星空背景旋转速度
  STARS_ROTATION_SPEED: 0.05,
  
  // 初始相机位置
  INITIAL_CAMERA_POSITION: { x: 0, y: 3, z: 8 },
  
  // 相机FOV
  CAMERA_FOV: 60,
  
  // 相机控制范围
  CAMERA_MIN_DISTANCE: 5,
  CAMERA_MAX_DISTANCE: 20,
};
