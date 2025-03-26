module.exports = {
    chainWebpack: config => {
        config.module
            .rule('fonts')
            .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/)
            .use('url-loader')
            .loader('url-loader')
            .options({
                limit: 4096, // 4kb
                fallback: {
                    loader: 'file-loader',
                    options: {
                        name: 'fonts/[name].[hash:8].[ext]'
                    }
                }
            })
    }
}
