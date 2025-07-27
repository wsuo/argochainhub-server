-- 创建登记申请测试数据
INSERT INTO registration_requests (
    regReqNo, 
    status, 
    details, 
    productSnapshot, 
    deadline, 
    buyerId, 
    supplierId, 
    productId,
    createdAt,
    updatedAt
) VALUES 
-- 1. 待回复的登记申请 - 美国市场
(
    'REG2025012701',
    'pending_response',
    '{
        "targetCountry": "US",
        "isExclusive": true,
        "docReqs": ["EPA Registration", "State Registration", "Product Label", "Safety Data Sheet"],
        "sampleReq": {
            "needed": true,
            "quantity": 5,
            "unit": "kg"
        },
        "timeline": "6 months",
        "budget": {
            "amount": 50000,
            "currency": "USD"
        },
        "additionalRequirements": "需要提供美国EPA注册支持，协助准备所有必要文件"
    }',
    '{
        "name": "草哭哭",
        "category": "除草剂",
        "formulation": "TF",
        "activeIngredient": "111 10%",
        "content": "500ml"
    }',
    '2025-06-30',
    17,  -- Global Agro Trading Ltd.
    2,   -- 绿田化工科技有限公司
    4,   -- 草哭哭产品
    NOW(),
    NOW()
),
-- 2. 进行中的登记申请 - 欧洲市场
(
    'REG2025012702',
    'in_progress',
    '{
        "targetCountry": "FR",
        "isExclusive": false,
        "docReqs": ["EU Dossier", "CLP Classification", "Efficacy Data", "Residue Studies"],
        "sampleReq": {
            "needed": true,
            "quantity": 10,
            "unit": "L"
        },
        "timeline": "12 months",
        "budget": {
            "amount": 80000,
            "currency": "EUR"
        },
        "additionalRequirements": "需要符合欧盟农药法规(EC) No 1107/2009",
        "statusNote": "已开始准备EU dossier，预计3个月完成初步文件",
        "lastUpdatedBy": "admin"
    }',
    '{
        "name": "花哭哭",
        "category": "杀虫剂",
        "formulation": "PC*",
        "activeIngredient": "花粉 20%",
        "content": "1L"
    }',
    '2025-12-31',
    18,  -- European Farm Solutions
    3,   -- 华农生物科技集团
    5,   -- 花哭哭产品
    DATE_SUB(NOW(), INTERVAL 1 MONTH),
    NOW()
),
-- 3. 已完成的登记申请 - 日本市场
(
    'REG2025010301',
    'completed',
    '{
        "targetCountry": "JP",
        "isExclusive": true,
        "docReqs": ["MAFF Registration", "Japanese Label", "GLP Studies"],
        "sampleReq": {
            "needed": false
        },
        "timeline": "18 months",
        "budget": {
            "amount": 12000000,
            "currency": "JPY"
        },
        "additionalRequirements": "需要日本本地代理支持",
        "statusNote": "登记已成功完成，获得MAFF批准号：JP-2025-001",
        "completionDate": "2025-01-15",
        "registrationNumber": "JP-2025-001"
    }',
    '{
        "name": "草哭哭",
        "category": "除草剂",
        "formulation": "TF",
        "activeIngredient": "111 10%",
        "content": "500ml"
    }',
    '2024-12-31',
    19,  -- Asia Pacific Agricultural Corp.
    2,   -- 绿田化工科技有限公司
    4,   -- 草哭哭产品
    DATE_SUB(NOW(), INTERVAL 6 MONTH),
    DATE_SUB(NOW(), INTERVAL 2 WEEK)
),
-- 4. 已拒绝的登记申请
(
    'REG2025011501',
    'declined',
    '{
        "targetCountry": "BR",
        "isExclusive": false,
        "docReqs": ["ANVISA Registration", "Local Efficacy Data"],
        "sampleReq": {
            "needed": true,
            "quantity": 20,
            "unit": "kg"
        },
        "timeline": "24 months",
        "budget": {
            "amount": 30000,
            "currency": "USD"
        },
        "additionalRequirements": "需要巴西本地试验数据",
        "statusNote": "预算不足，无法支持完整的巴西登记流程",
        "declineReason": "客户预算与实际登记成本差距过大"
    }',
    '{
        "name": "花哭哭",
        "category": "杀虫剂",
        "formulation": "PC*",
        "activeIngredient": "花粉 20%",
        "content": "1L"
    }',
    '2025-08-31',
    1,   -- 阳光农业采购有限公司
    3,   -- 华农生物科技集团
    5,   -- 花哭哭产品
    DATE_SUB(NOW(), INTERVAL 2 MONTH),
    DATE_SUB(NOW(), INTERVAL 1 MONTH)
),
-- 5. 已取消的登记申请
(
    'REG2025012001',
    'cancelled',
    '{
        "targetCountry": "AU",
        "isExclusive": true,
        "docReqs": ["APVMA Registration", "Australian GLP Studies"],
        "sampleReq": {
            "needed": true,
            "quantity": 15,
            "unit": "L"
        },
        "timeline": "12 months",
        "budget": {
            "amount": 100000,
            "currency": "AUD"
        },
        "additionalRequirements": "需要澳大利亚本地代理",
        "statusNote": "客户战略调整，暂停澳大利亚市场拓展",
        "cancelReason": "Business strategy changed"
    }',
    '{
        "name": "草哭哭",
        "category": "除草剂",
        "formulation": "TF",
        "activeIngredient": "111 10%",
        "content": "500ml"
    }',
    '2025-10-31',
    17,  -- Global Agro Trading Ltd.
    2,   -- 绿田化工科技有限公司
    4,   -- 草哭哭产品
    DATE_SUB(NOW(), INTERVAL 1 WEEK),
    DATE_SUB(NOW(), INTERVAL 3 DAY)
),
-- 6. 新的待回复登记申请 - 加拿大市场
(
    'REG2025012703',
    'pending_response',
    '{
        "targetCountry": "CA",
        "isExclusive": false,
        "docReqs": ["PMRA Registration", "Canadian Label", "Efficacy Studies"],
        "sampleReq": {
            "needed": true,
            "quantity": 8,
            "unit": "kg"
        },
        "timeline": "9 months",
        "budget": {
            "amount": 60000,
            "currency": "CAD"
        },
        "additionalRequirements": "需要提供法语和英语双语标签"
    }',
    '{
        "name": "花哭哭",
        "category": "杀虫剂",
        "formulation": "PC*",
        "activeIngredient": "花粉 20%",
        "content": "1L"
    }',
    '2025-09-30',
    18,  -- European Farm Solutions
    3,   -- 华农生物科技集团
    5,   -- 花哭哭产品
    DATE_SUB(NOW(), INTERVAL 2 DAY),
    DATE_SUB(NOW(), INTERVAL 2 DAY)
);