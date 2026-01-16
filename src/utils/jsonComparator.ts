/**
 * JSON 比对工具
 * 用于比对两个 JSON 对象的差异
 */

/**
 * 差异项类型
 */
export interface DiffItem {
  path: string           // JSON 路径，如 "data.users[0].name"
  type: 'added' | 'removed' | 'modified' | 'missing' | 'key-changed'
  oldValue?: any
  newValue?: any
  leftKey?: string       // 左侧的 key
  rightKey?: string      // 右侧的 key（如果不同）
  lineNumber?: number    // 在树形结构中的行号
}

/**
 * 树节点
 */
export interface TreeNode {
  key: string            // 节点的 key
  value?: any            // 节点的值（叶子节点）
  type: 'object' | 'array' | 'value'  // 节点类型
  path: string           // JSON 路径
  children?: TreeNode[]  // 子节点
  expanded?: boolean     // 是否展开
  diffType?: DiffItem['type']  // 差异类型
  lineNumber?: number    // 行号
}

/**
 * 比对结果
 */
export interface CompareResult {
  leftTree: TreeNode[]
  rightTree: TreeNode[]
  diffs: DiffItem[]
  diffCount: number
}

/**
 * 比对两个 JSON 对象
 * @param left 左侧 JSON（基准）
 * @param right 右侧 JSON（对比）
 * @param mode 比对模式：'outline' 只比对 key，'full' 比对 key 和 value
 * @returns 比对结果
 */
export function compareJson(
  left: any,
  right: any,
  mode: 'outline' | 'full'
): CompareResult {
  const diffs: DiffItem[] = []

  // 生成树形结构
  const leftTree = buildTree(left, '', 0, diffs, 'left', mode)
  const rightTree = buildTree(right, '', 0, diffs, 'right', mode)

  // 执行比对
  compareNodes(leftTree, rightTree, diffs, mode)

  // 为每个差异项分配行号
  assignLineNumbers(leftTree, rightTree, diffs)

  return {
    leftTree,
    rightTree,
    diffs,
    diffCount: diffs.length
  }
}

/**
 * 构建 JSON 树形结构
 */
function buildTree(
  data: any,
  path: string,
  depth: number,
  diffs: DiffItem[],
  side: 'left' | 'right',
  mode: 'outline' | 'full'
): TreeNode[] {
  const nodes: TreeNode[] = []

  if (data === null || data === undefined) {
    return nodes
  }

  if (Array.isArray(data)) {
    // 处理数组
    data.forEach((item, index) => {
      const currentPath = path ? `${path}[${index}]` : `[${index}]`
      const node: TreeNode = {
        key: `[${index}]`,
        type: getType(item),
        path: currentPath
      }

      if (isPrimitive(item)) {
        node.value = item
        node.type = 'value'
      } else {
        node.children = buildTree(item, currentPath, depth + 1, diffs, side, mode)
        node.expanded = depth < 2  // 默认展开前两层
      }

      nodes.push(node)
    })
  } else if (typeof data === 'object') {
    // 处理对象
    Object.keys(data).forEach(key => {
      const value = data[key]
      const currentPath = path ? `${path}.${key}` : key
      const node: TreeNode = {
        key,
        type: getType(value),
        path: currentPath
      }

      if (isPrimitive(value)) {
        node.value = value
        node.type = 'value'
      } else {
        node.children = buildTree(value, currentPath, depth + 1, diffs, side, mode)
        node.expanded = depth < 2  // 默认展开前两层
      }

      nodes.push(node)
    })
  }

  return nodes
}

/**
 * 递归比对节点
 */
function compareNodes(
  leftNodes: TreeNode[],
  rightNodes: TreeNode[],
  diffs: DiffItem[],
  mode: 'outline' | 'full'
): void {
  const leftKeys = new Set(leftNodes.map(n => n.key))
  const rightKeys = new Set(rightNodes.map(n => n.key))

  // 检查左侧有但右侧没有的（删除）
  leftKeys.forEach(key => {
    if (!rightKeys.has(key)) {
      const leftNode = leftNodes.find(n => n.key === key)!
      diffs.push({
        path: leftNode.path,
        type: 'removed',
        oldValue: leftNode.value,
        leftKey: key
      })
    }
  })

  // 检查右侧有但左侧没有的（新增）
  rightKeys.forEach(key => {
    if (!leftKeys.has(key)) {
      const rightNode = rightNodes.find(n => n.key === key)!
      diffs.push({
        path: rightNode.path,
        type: 'added',
        newValue: rightNode.value,
        rightKey: key
      })
    }
  })

  // 检查两边都有的 key
  leftKeys.forEach(key => {
    if (rightKeys.has(key)) {
      const leftNode = leftNodes.find(n => n.key === key)!
      const rightNode = rightNodes.find(n => n.key === key)!

      // 比对值
      if (mode === 'full') {
        // 完整比对：比较值
        if (leftNode.type === 'value' && rightNode.type === 'value') {
          if (!isEqual(leftNode.value, rightNode.value)) {
            diffs.push({
              path: leftNode.path,
              type: 'modified',
              oldValue: leftNode.value,
              newValue: rightNode.value,
              leftKey: key,
              rightKey: key
            })
          }
        } else if (leftNode.children && rightNode.children) {
          // 递归比对子节点
          compareNodes(leftNode.children, rightNode.children, diffs, mode)
        }
      } else {
        // 大纲比对：只比对 key，不比对 value
        // 但仍然需要递归处理子对象
        if (leftNode.children && rightNode.children) {
          compareNodes(leftNode.children, rightNode.children, diffs, mode)
        }
      }
    }
  })
}

/**
 * 为差异项分配行号
 */
function assignLineNumbers(
  leftTree: TreeNode[],
  rightTree: TreeNode[],
  diffs: DiffItem[]
): void {
  const leftLineMap = new Map<string, number>()
  const rightLineMap = new Map<string, number>()

  let lineNumber = 0

  // 遍历左侧树
  function traverseLeft(nodes: TreeNode[]) {
    nodes.forEach(node => {
      lineNumber++
      leftLineMap.set(node.path, lineNumber)
      if (node.children) {
        traverseLeft(node.children)
      }
    })
  }

  lineNumber = 0
  traverseLeft(leftTree)

  // 遍历右侧树
  function traverseRight(nodes: TreeNode[]) {
    nodes.forEach(node => {
      lineNumber++
      rightLineMap.set(node.path, lineNumber)
      if (node.children) {
        traverseRight(node.children)
      }
    })
  }

  lineNumber = 0
  traverseRight(rightTree)

  // 为差异项分配行号
  diffs.forEach(diff => {
    if (diff.type === 'added') {
      diff.lineNumber = rightLineMap.get(diff.path)
    } else {
      diff.lineNumber = leftLineMap.get(diff.path)
    }
  })
}

/**
 * 获取值的类型
 */
function getType(value: any): 'object' | 'array' | 'value' {
  if (Array.isArray(value)) {
    return 'array'
  }
  if (value !== null && typeof value === 'object') {
    return 'object'
  }
  return 'value'
}

/**
 * 判断是否为基本类型
 */
function isPrimitive(value: any): boolean {
  return value === null ||
         typeof value === 'string' ||
         typeof value === 'number' ||
         typeof value === 'boolean'
}

/**
 * 深度比较两个值是否相等
 */
function isEqual(a: any, b: any): boolean {
  if (a === b) return true

  if (a === null || b === null) return false
  if (a === undefined || b === undefined) return false

  if (typeof a !== typeof b) return false

  if (typeof a !== 'object') return false

  if (Array.isArray(a) !== Array.isArray(b)) return false

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) return false
    }
    return true
  }

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!keysB.includes(key)) return false
    if (!isEqual(a[key], b[key])) return false
  }

  return true
}

/**
 * 验证 JSON 字符串是否有效
 */
export function validateJson(jsonString: string): boolean {
  try {
    JSON.parse(jsonString)
    return true
  } catch {
    return false
  }
}

/**
 * 格式化 JSON 字符串
 */
export function formatJson(jsonString: string, indent: number = 2): string {
  try {
    const parsed = JSON.parse(jsonString)
    return JSON.stringify(parsed, null, indent)
  } catch {
    return jsonString
  }
}

/**
 * 压缩 JSON 字符串
 */
export function minifyJson(jsonString: string): string {
  try {
    const parsed = JSON.parse(jsonString)
    return JSON.stringify(parsed)
  } catch {
    return jsonString
  }
}
