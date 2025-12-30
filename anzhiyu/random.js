var posts=["2025/12/03/🚀 Visual Studio 2022 快捷键使用教程/","2025/11/24/电子消息系统伪代码设计/","2025/12/30/带你入门数据处理2/","2025/12/28/带你入门数据处理1/","2025/12/16/cPorject团队协作的改进与反思/","2025/12/06/VScode中gcc编译配置文件的介绍/","2025/12/06/Quick Start/","2025/10/15/这是一次测试/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };