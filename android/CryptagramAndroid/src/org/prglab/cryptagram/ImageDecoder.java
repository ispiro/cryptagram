package org.prglab.cryptagram;

import android.graphics.Bitmap;

public interface ImageDecoder {
	
	class HashCheckFailedException extends Exception{
		public static final long serialVersionUID = 1L;
	}
	
	/**
	 * Try decoding the given bitmap with the given password using a
	 * Cryptagram decoding scheme
	 * 
	 * @param encodedImage the Bitmap of the image to decode
	 * @return the base64-encoded data in the image
	 */
	public abstract String decodeBitmap(Bitmap encodedImage) throws HashCheckFailedException;
}
