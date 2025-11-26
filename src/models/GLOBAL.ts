/**
 * 这个models 用来管理全局样式、设备检测相关的状态
 * 和系统界面交互有关的，都放在这里进行维护
 */

import { useState, useCallback } from 'react';
 

export default function useGlobalStyleModel() {
    // 全局加载状态
    const [globalLoading, setGlobalLoading] = useState(false);
 
    // 设置全局加载状态
    const setLoading = useCallback((loading: boolean) => {
        setGlobalLoading(loading);
    }, []);

 

    return { 
         
        globalLoading,
        setLoading,
 

    };
}