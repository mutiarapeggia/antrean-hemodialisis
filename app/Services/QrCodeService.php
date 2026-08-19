<?php

namespace App\Services;

use chillerlan\QRCode\QRCode;
use Throwable;

class QrCodeService
{
    /**
     * Generate 100% valid base64 Data URI for <img> tags
     */
    public static function generateDataUri(string $text): string
    {
        $payload = !empty($text) ? trim($text) : 'RM-9901';

        try {
            return (new QRCode())->render($payload);
        } catch (Throwable $e) {
            return '';
        }
    }

    /**
     * Generate pure inline SVG string (no xml header, explicit width/height)
     */
    public static function generateSvg(string $text, int $size = 200): string
    {
        $payload = !empty($text) ? trim($text) : 'RM-9901';

        try {
            $dataUri = self::generateDataUri($payload);
            $base64 = str_replace('data:image/svg+xml;base64,', '', $dataUri);
            $rawSvg = base64_decode($base64);

            // Strip XML declaration header for inline HTML5 dangerouslySetInnerHTML
            $svg = preg_replace('/<\?xml.*?\?>/s', '', $rawSvg);

            // Ensure svg element has explicit width and height
            if (strpos($svg, '<svg') !== false && strpos($svg, 'width=') === false) {
                $svg = str_replace(
                    '<svg ',
                    '<svg width="'.$size.'" height="'.$size.'" style="width: '.$size.'px; height: '.$size.'px; display: block; margin: 0 auto;" ',
                    $svg
                );
            }

            return trim($svg);
        } catch (Throwable $e) {
            return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="'.$size.'" height="'.$size.'"><rect width="200" height="200" fill="#ffffff"/><text x="10" y="100" font-size="14" fill="#000000">'.htmlspecialchars($payload, ENT_QUOTES, 'UTF-8').'</text></svg>';
        }
    }
}
