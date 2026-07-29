module.exports = {
    apps : [{
        name: "mi-backend",
        script: "./dist/index.js",
        instances: "max",
        exec_mode: "cluster",
        env: {
            NODE_ENV: "development",
        }
    }]
}