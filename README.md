# Zhixing Zhang — Career Portfolio

Static portfolio for GitHub Pages.

## Publish updates

1. Edit the HTML, `assets/site.js`, `assets/styles.css`, or add optimized images to `assets/work/`.
2. Commit and push to the `main` branch.
3. In GitHub: **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, then select `main` and `/ (root)`.

The `CNAME` file keeps `career.zhixingzhang.com` attached to the site. Do not remove it.

## Local preview

You can double-click `index.html` directly. All project links will work from local files too.

For a closer simulation of the final website, open Terminal inside this folder and run:

```bash
python3 -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000) in a browser. Stop the preview with `Control + C`.

## Custom domain DNS

After enabling Pages, set one DNS record:

| Type | Name | Target |
| --- | --- | --- |
| CNAME | `career` | `zhangzhixingken.github.io` |

In the repository Pages settings, set the custom domain to `career.zhixingzhang.com` and enable **Enforce HTTPS** when it becomes available.
