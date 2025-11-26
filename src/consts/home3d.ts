/**
 * 3D Home 页面配置常量
 */

/**
 * 星球相关配置
 */
export const PLANET_CONFIG = {
  // 星球基础大小
  BASE_RADIUS: 0.8, // 减小默认大小，使星球在初始视角中可见
  
  // 星球旋转速度
  ROTATION_SPEED: 0.1, // 降低旋转速度，使视觉效果更舒适
  
  // 轨道半径（星球围绕中心点的距离）
  ORBIT_RADIUS: 4, // 减小轨道半径，使星球在视图范围内
  
  // 轨道旋转速度（星球围绕中心点旋转的速度）
  ORBIT_ROTATION_SPEED: 0.15, // 增加轨道旋转速度，使旋转效果更明显
};

/**
 * 卫星相关配置
 */
export const SATELLITE_CONFIG = {
  // 卫星轨道配置
  ORBIT_SPEED_BASE: 0.3,
  ORBIT_SPEED_VARIATION: 0.4,
  
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
  INITIAL_CAMERA_POSITION: { x: 0, y: 5, z: 12 },
  
  // 相机FOV
  CAMERA_FOV: 60,
  
  // 相机控制范围
  CAMERA_MIN_DISTANCE: 5,
  CAMERA_MAX_DISTANCE: 20,
};
