const { FuseBox, WebIndexPlugin } = require("fuse-box");

const fuse = FuseBox.init({
    homeDir: "src",
    output: "build/$name.js",
    sourceMaps: true,
    plugins: [
        WebIndexPlugin(),
    ]
});
fuse.dev();

fuse.bundle("app")
    .instructions(`> index.ts`)
    .hmr()
    .watch();

fuse.run();
