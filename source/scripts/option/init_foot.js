/**
 * Init Foot Structure
 */
{

    const foot = document.getElementById("foot");
    const html = `
        <div class="foot-navigator">
            <a class="prev" data-disabled="true" title="上一页"><i class="fa fa-chevron-left"></i></a>
            <a class="hint">
                <span class="pagination">- / -</span>
                <span>Ctrl+左右方向键也可以翻页</span>
            </a>
            <a class="next" data-disabled="true" title="下一页"><i class="fa fa-chevron-right"></i></a>
        </div>
        <div class="foot-bottom">
            <div class="foot-line"></div>
            <div class="foot-menu">
                <a href="http://www.bixiv.com/donate" target="_blank" title="扩展很棒，捐赠以表支持 +1s">捐赠</a>
                <a href="https://github.com/Aqours/Weibo-Picture-Store/issues" target="_blank" title="Github Issues">Github</a>
                <a href="http://www.bixiv.com/2bps/189" target="_blank" title="如果你没有 GitHub 账号，可以使用此方式反馈问题">反馈</a>
                <a href="mailto:git@hub.moe" title="使用电子邮件联系我">联系我</a>
            </div>
        </div>`;

    foot.append(Utils.parseHTML(html));

}
