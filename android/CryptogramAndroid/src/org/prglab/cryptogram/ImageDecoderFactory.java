package org.prglab.cryptogram;

import android.graphics.Bitmap;

/** Factory class to find the right decoder for a given image. */
public class ImageDecoderFactory {
	// Cache decoder classes for efficiency
	private static AestheteDecoder aestheteDecoder = new AestheteDecoder();
	private static BacchantDecoder bacchantDecoder = new BacchantDecoder();
	
	/**
	 * Get an ImageDecoder to handle the argument image.
	 * @param b the bitmap that will be decoded.
	 * @return an ImageDecoder that is capable of handling the image
	 */
	public static ImageDecoder getDecoder(Bitmap b){
		// TODO: Read the image header and determine the protocol.
		// For now assume aesthete
		return aestheteDecoder;
	}
}
