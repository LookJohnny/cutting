module.exports = {
  publicPath: './',
  outputDir: 'dist/h5',
  assetsDir: 'static',
  productionSourceMap: false,
  chainWebpack: (config) => {
    config.plugin('html').tap((args) => {
      args[0].title = '石头人板材裁切方案计算器';
      return args;
    });
  }
}
