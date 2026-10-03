package com.mattermost.pasteinputtext

import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.provider.DocumentsContract
import android.provider.MediaStore
import android.provider.OpenableColumns
import android.util.Log
import android.webkit.MimeTypeMap
import android.text.TextUtils
import java.io.*

object RealPathUtil {
  init {
    deleteTempFiles(File(PasteTextInputManager.CACHE_DIR_NAME))
  }

  fun getRealPathFromURI(context: Context, uri: Uri, mimeType: String? = null): String? {
    // DocumentProvider
    if (DocumentsContract.isDocumentUri(context, uri)) {
      // ExternalStorageProvider
      if (isExternalStorageDocument(uri)) {
        val docId = DocumentsContract.getDocumentId(uri)
        val split = docId.split((":").toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()
        val type = split[0]
        if ("primary".equals(type, ignoreCase = true)) {
          return context.getExternalFilesDir(split[1])?.absolutePath
        }
      } else if (isDownloadsDocument(uri)) {
        // DownloadsProvider
        val id = DocumentsContract.getDocumentId(uri)
        if (!TextUtils.isEmpty(id)) {
          if (id.startsWith("raw:")) {
            return id.replaceFirst(("raw:").toRegex(), "")
          }
          try {
            return getPathFromSavingTempFile(context, uri, mimeType)
          } catch (e: NumberFormatException) {
            Log.e("ReactNative", "DownloadsProvider unexpected uri $uri")
            return null
          }
        }
      } else if (isMediaDocument(uri)) {
        // MediaProvider
        val docId = DocumentsContract.getDocumentId(uri)
        val split = docId.split((":").toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()
        val type = split[0]
        var contentUri: Uri? = null
        when (type) {
            "image" -> {
              contentUri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI
            }
            "video" -> {
              contentUri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI
            }
            "audio" -> {
              contentUri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
            }
        }
        val selectionArgs = arrayOf(split[1])
        return contentUri?.let { getDataColumn(context, it, selectionArgs) }
      }
    }
    if ("content".equals(uri.scheme, ignoreCase = true)) {
      // MediaStore (and general)
      if (isGooglePhotosUri(uri)) {
        return uri.lastPathSegment
      }
      // Try save to tmp file, and return tmp file path
      return getPathFromSavingTempFile(context, uri, mimeType)
    } else if ("file".equals(uri.scheme, ignoreCase = true)) {
      return uri.path
    }
    return null
  }

  private fun getPathFromSavingTempFile(context: Context, uri: Uri, mimeType: String?): String? {
    val tmpFile: File
    var fileName: String? = null
    // Try and get the filename from the Uri
    try {
      val returnCursor = context.contentResolver.query(uri, null, null, null, null)
      val nameIndex = returnCursor?.getColumnIndex(OpenableColumns.DISPLAY_NAME)
      returnCursor?.moveToFirst()
      fileName = sanitizeFilename(nameIndex?.let { returnCursor.getString(it) })
      returnCursor?.close()
    } catch (e: Exception) {
      // just continue to get the filename with the last segment of the path
    }
    try {
      if (fileName == null) {
        fileName = sanitizeFilename(uri.lastPathSegment.toString().trim())
      }
      // A keyboard's content URI has no file extension ('.../inputContent'), and
      // everything downstream reads the type off the name. Give the copy the
      // extension the provider's declared type implies.
      if (fileName != null && !fileName.contains('.') && mimeType != null) {
        MimeTypeMap.getSingleton().getExtensionFromMimeType(mimeType)?.let { fileName = "$fileName.$it" }
      }
      val cacheDir = File(context.cacheDir, PasteTextInputManager.CACHE_DIR_NAME)
      if (!cacheDir.exists()) {
        cacheDir.mkdirs()
      }

      // Unique per paste: two different GIFs from the same keyboard share the
      // name 'inputContent', and the second must not read the first's file.
      tmpFile = fileName?.let { File(cacheDir, "${System.currentTimeMillis()}-$it") }!!
      // Stream copy: a provider's stream is not seekable and reports no size, so
      // the old channel transferFrom(src, 0, src.size()) could copy nothing.
      val input = context.contentResolver.openInputStream(uri) ?: return null
      input.use { source -> FileOutputStream(tmpFile).use { sink -> source.copyTo(sink) } }
    } catch (ex: IOException) {
      return null
    }
    return tmpFile.absolutePath
  }

  private fun sanitizeFilename(filename: String?): String? {
    if (filename == null) {
      return null
    }

    val f = File(filename)
    return f.name
  }

  private fun getDataColumn(context: Context, uri: Uri,
                            selectionArgs: Array<String>): String? {
    var cursor: Cursor? = null
    val column = "_data"
    val selection = "_id=?"
    val projection = arrayOf(column)
    try {
      cursor = context.contentResolver.query(uri, projection, selection, selectionArgs, null)
      if (cursor != null && cursor.moveToFirst()) {
        val index = cursor.getColumnIndexOrThrow(column)
        return cursor.getString(index)
      }
    } finally {
      cursor?.close()
    }

    return null
  }

  private fun isExternalStorageDocument(uri: Uri): Boolean {
    return "com.android.externalstorage.documents" == uri.authority
  }

  private fun isDownloadsDocument(uri: Uri): Boolean {
    return "com.android.providers.downloads.documents" == uri.authority
  }

  private fun isMediaDocument(uri: Uri): Boolean {
    return "com.android.providers.media.documents" == uri.authority
  }

  private fun isGooglePhotosUri(uri: Uri): Boolean {
    return "com.google.android.apps.photos.content" == uri.authority
  }

    private fun deleteTempFiles(dir: File) {
    try {
      if (dir.isDirectory) {
        deleteRecursive(dir)
      }
    } catch (e: Exception) {
      // do nothing
    }
  }

  private fun deleteRecursive(fileOrDirectory: File) {
    if (fileOrDirectory.isDirectory)
      for (child in fileOrDirectory.listFiles()!!)
        deleteRecursive(child)
    fileOrDirectory.delete()
  }
}
