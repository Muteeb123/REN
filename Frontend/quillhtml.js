export const quillHTML = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">

    <style>
      body {
        margin: 0;
        padding: 0;
        background: transparent;
        font-family: sans-serif;
      }

      #toolbar {
        padding: 8px;
        background: #f2f2f2;
        border-bottom: 1px solid #ddd;
        display: flex;
        gap: 6px;
      }

      #editor {
        padding: 14px;
        font-size: 17px;
        line-height: 1.6;
        height: 80vh;
        box-sizing: border-box;
      }

      .ql-container, .ql-editor {
        border: none !important;
      }
    </style>
  </head>

  <body>

    <div id="toolbar">
      <button class="ql-bold"></button>
      <button class="ql-italic"></button>
      <button class="ql-underline"></button>
      <button class="ql-list" value="ordered"></button>
      <button class="ql-list" value="bullet"></button>
    </div>

    <div id="editor"></div>

    <script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>

   <script>
  const quill = new Quill("#editor", {
    theme: "snow",
    modules: { toolbar: "#toolbar" }
  });

  quill.on("text-change", () => {
    const html = quill.root.innerHTML;
    window.ReactNativeWebView.postMessage(html);
  });

  // Listen for messages from React Native
  document.addEventListener("message", function(event) {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === "set-content") {
        quill.root.innerHTML = msg.html || "";
      }
    } catch(e) { console.error(e); }
  });

  // For iOS (window.ReactNativeWebView.onMessage)
  window.addEventListener("message", function(event) {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === "set-content") {
        quill.root.innerHTML = msg.html || "";
      }
    } catch(e) { console.error(e); }
  });
</script>

  </body>
</html>
`;