package com.mattermost.pasteinputtext

import android.content.ClipboardManager
import android.content.Context
import android.net.Uri
import android.util.Patterns
import android.webkit.MimeTypeMap
import android.webkit.URLUtil
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.EventDispatcher
import java.io.FileNotFoundException

class PasteInputListener(editText: PasteInputEditText, surfaceId: Int) : IPasteInputListener {
  private val mEditText = editText
  private val mSurfaceId = surfaceId

  override fun onPaste(itemUri: Uri, eventDispatcher: EventDispatcher?) {
    val reactContext = mEditText.context as ReactContext
    // What the provider itself says the content is. A keyboard's GIF panel hands
    // over a URI whose last segment is not a file name ('.../inputContent?...'),
    // so the type cannot be read off the path.
    val declaredType: String? = reactContext.contentResolver.getType(itemUri)

    var uriString: String = itemUri.toString()
    val mimeType: String
    val fileSize: Long
    var files: WritableArray? = null
    var error: WritableMap? = null

    // Special handle for Google docs
    if (uriString == "content://com.google.android.apps.docs.editors.kix.editors.clipboard") {
      val clipboardManager = reactContext.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
      val clipData = clipboardManager.primaryClip
      val item = clipData?.getItemAt(0)
      if (item == null) {
        dispatchError("The clipboard is empty", eventDispatcher)
        return
      }
      val htmlText = item.htmlText

      // Find uri from html
      val matcher = Patterns.WEB_URL.matcher(htmlText)
      if (matcher.find()) {
        uriString = htmlText.substring(matcher.start(1), matcher.end())
      }
    } else if (uriString.startsWith("http")) {
      val pastImageFromUrlThread = Thread(PasteInputFileFromUrl(
        mEditText,
        uriString,
        mSurfaceId,
        eventDispatcher
      ))
      pastImageFromUrlThread.start()
      return
    } else {
      val realPath = RealPathUtil.getRealPathFromURI(reactContext, itemUri, declaredType)
      if (realPath == null) {
        dispatchError("Could not read the pasted content", eventDispatcher)
        return
      }
      uriString = realPath
    }

    // The provider's declared type wins; the file extension is the fallback for
    // sources that declare none (file:// URIs).
    val extension: String = MimeTypeMap.getFileExtensionFromUrl(uriString)
    val resolvedType = declaredType ?: MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension)
    if (resolvedType == null) {
      dispatchError("Could not tell what kind of content was pasted", eventDispatcher)
      return
    }
    mimeType = resolvedType
    val fileName: String = URLUtil.guessFileName(uriString, null, mimeType)

    try {
      val contentResolver = reactContext.contentResolver
      val assetFileDescriptor = contentResolver.openAssetFileDescriptor(itemUri, "r")
      if (assetFileDescriptor == null) {
        dispatchError("Could not open the pasted content", eventDispatcher)
        return
      }
      val file = Arguments.createMap()

      files = Arguments.createArray()
      fileSize = assetFileDescriptor.length
      file.putString("type", mimeType)
      file.putDouble("fileSize", fileSize.toDouble())
      file.putString("fileName", fileName)
      file.putString("uri", "file://$uriString")

      files.pushMap(file)
      assetFileDescriptor.close()
    } catch (e: FileNotFoundException) {
      error = Arguments.createMap()
      error.putString("message", e.localizedMessage)
    }

    val event = Arguments.createMap()
    event.putArray("data", files)
    event.putMap("error", error)

    eventDispatcher?.dispatchEvent(PasteTextInputPasteEvent(mSurfaceId, mEditText.id, event))
  }

  /**
   * Every way a paste can fail now reports it to JS. These used to be bare
   * `return`s, so a keyboard commit that could not be read did nothing at all:
   * no attachment and no message.
   */
  private fun dispatchError(message: String, eventDispatcher: EventDispatcher?) {
    val error = Arguments.createMap()
    error.putString("message", message)
    val event = Arguments.createMap()
    event.putArray("data", null)
    event.putMap("error", error)
    eventDispatcher?.dispatchEvent(PasteTextInputPasteEvent(mSurfaceId, mEditText.id, event))
  }
}
