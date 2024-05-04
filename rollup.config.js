export default function({slug, release}){
  const fn = slug.replaceAll("-","");
  return [{
    input: [
      `src/games/${slug}/table/${release}/simulate.js`
    ],
    output: {
      file: `sim/bundle/${fn}_${release}.js`,
      format: 'esm',
      interop: "esModule"
    },
    external: [],
    plugins: [
    ]
  }];

}
