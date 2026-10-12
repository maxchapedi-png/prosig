package pe.prosig.app

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.print.PrintAttributes
import android.print.PrintManager
import android.provider.MediaStore
import android.view.View
import android.webkit.*
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader
import java.io.File

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private val RC_FILE = 100

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        webView = findViewById(R.id.webview)

        // Sirve los archivos de assets/ como https://appassets.androidplatform.net/ (permite localStorage estable)
        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            setSupportZoom(false)
            textZoom = 100
        }
        webView.addJavascriptInterface(Bridge(), "Android")
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                loader.shouldInterceptRequest(request.url)
        }
        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                wv: WebView, cb: ValueCallback<Array<Uri>>, params: FileChooserParams
            ): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = cb
                val i = Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "*/*"
                }
                return try { startActivityForResult(Intent.createChooser(i, "Seleccionar respaldo"), RC_FILE); true }
                catch (e: Exception) { fileCallback = null; false }
            }
            override fun onJsConfirm(view: WebView, url: String, message: String, result: JsResult): Boolean {
                androidx.appcompat.app.AlertDialog.Builder(this@MainActivity)
                    .setMessage(message)
                    .setPositiveButton("Aceptar") { _, _ -> result.confirm() }
                    .setNegativeButton("Cancelar") { _, _ -> result.cancel() }
                    .setOnCancelListener { result.cancel() }
                    .show()
                return true
            }
        }

        if (savedInstanceState == null) {
            webView.loadUrl("https://appassets.androidplatform.net/assets/www/index.html")
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == RC_FILE) {
            val r = if (resultCode == Activity.RESULT_OK && data?.data != null) arrayOf(data.data!!) else null
            fileCallback?.onReceiveValue(r)
            fileCallback = null
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    override fun onPause() { super.onPause(); webView.evaluateJavascript("window.dispatchEvent(new Event('pagehide'))", null) }

    inner class Bridge {
        /** Guarda un archivo de texto (respaldo .json, .csv) en la carpeta Descargas. */
        @JavascriptInterface
        fun guardarArchivo(nombre: String, mime: String, contenido: String) {
            try {
                val bytes = contenido.toByteArray(Charsets.UTF_8)
                if (Build.VERSION.SDK_INT >= 29) {
                    val v = ContentValues().apply {
                        put(MediaStore.Downloads.DISPLAY_NAME, nombre)
                        put(MediaStore.Downloads.MIME_TYPE, mime)
                        put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                    }
                    val uri = contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v)
                        ?: throw Exception("No se pudo crear el archivo")
                    contentResolver.openOutputStream(uri)!!.use { it.write(bytes) }
                } else {
                    val dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                    dir.mkdirs()
                    File(dir, nombre).writeBytes(bytes)
                }
                toast("Guardado en Descargas: $nombre")
            } catch (e: Exception) {
                toast("No se pudo guardar: ${e.message}")
            }
        }

        /** Imprime la pantalla actual o la guarda como PDF (cuadro de impresión de Android). */
        @JavascriptInterface
        fun imprimir(titulo: String) {
            runOnUiThread {
                val pm = getSystemService(Context.PRINT_SERVICE) as PrintManager
                pm.print(titulo, webView.createPrintDocumentAdapter(titulo), PrintAttributes.Builder().build())
            }
        }

        @JavascriptInterface
        fun salir() { runOnUiThread { finish() } }

        private fun toast(t: String) = runOnUiThread { Toast.makeText(this@MainActivity, t, Toast.LENGTH_LONG).show() }
    }
}
