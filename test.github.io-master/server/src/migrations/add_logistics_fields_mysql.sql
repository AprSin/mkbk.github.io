-- 添加物流相关字段到 orders 表

-- 添加 delivered_at 字段（送达时间）
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivered_at DATETIME NULL COMMENT '送达时间（确认收货时间）';

-- 添加 logistics_status 字段（物流状态）
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS logistics_status ENUM('未发货', '已发货', '运输中', '已签收', '已退回') 
DEFAULT '未发货' 
COMMENT '物流状态';
