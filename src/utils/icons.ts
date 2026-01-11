/**
 * Element Plus Icons 映射
 * 将不存在的图标映射到存在的图标
 */

// 不存在的图标 -> 替换为存在的图标
export const iconMap = {
  // 计算相关
  Calculator: 'Management',
  Scale: 'Scale',

  // 食物相关
  FoodIcon: 'Operation',
  Food: 'Operation',

  // 交通相关
  Car: 'Van',
  Vehicle: 'Van',

  // 娱乐相关
  Bowling: 'Grid',
  Game: 'Grid',

  // 价格相关
  Price: 'Tag',
  Cost: 'Tag',

  // 博客相关
  Blog: 'Grid',
  Post: 'Document',

  // 笔记本
  Notebook: 'Notebook',

  // 其他
  Warning: 'Warning',
  Check: 'Check'
} as const

// 确认存在的常用图标
export const safeIcons = {
  // 方向性
  ArrowRight: 'ArrowRight',
  ArrowLeft: 'ArrowLeft',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',

  // 基础
  Search: 'Search',
  Close: 'Close',
  Check: 'Check',
  Delete: 'Delete',
  Edit: 'Edit',
  Plus: 'Plus',
  Minus: 'Minus',

  // 功能
  Setting: 'Setting',
  Tools: 'Tools',
  Management: 'Management',
  Operation: 'Operation',

  // 数据
  TrendCharts: 'TrendCharts',
  DataLine: 'DataLine',
  DataAnalysis: 'TrendCharts',

  // 文件
  Document: 'Document',
  DocumentCopy: 'DocumentCopy',
  Folder: 'Folder',
  Notebook: 'Notebook',

  // 财务
  Wallet: 'Wallet',
  WalletFilled: 'WalletFilled',
  CreditCard: 'CreditCard',
  Money: 'Money',

  // 通知
  Bell: 'Bell',
  InfoFilled: 'InfoFilled',
  Warning: 'Warning',
  CircleCheck: 'CircleCheck',
  CircleClose: 'CircleClose',

  // 用户
  User: 'User',
  UserFilled: 'UserFilled',

  // 时间
  Timer: 'Timer',
  Calendar: 'Calendar',
  Clock: 'Clock',

  // 界面
  Grid: 'Grid',
  List: 'List',
  Menu: 'Menu',

  // 下载上传
  Download: 'Download',
  Upload: 'Upload',

  // 其他
  Refresh: 'Refresh',
  Fold: 'Fold',
  Expand: 'Expand',
  House: 'House',
  Van: 'Van',
  ShoppingBag: 'ShoppingBag',
  ShoppingCart: 'ShoppingCart',
  Tag: 'Tag',
  Scale: 'Scale'
} as const
