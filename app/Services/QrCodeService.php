<?php

namespace App\Services;

class QrCodeService
{
    /**
     * Generate inline SVG representation for QR Token.
     */
    public static function generateSvg(string $text, int $size = 200): string
    {
        // Simple, clean SVG data representation for QR token display
        $encodedText = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
        $hash = md5($text);
        
        // Generate a deterministic 17x17 grid pattern based on text hash for visual QR appearance
        $cells = '';
        $cellSize = $size / 19;
        
        // Finder patterns (top-left, top-right, bottom-left)
        $cells .= self::renderFinderPattern(1, 1, $cellSize);
        $cells .= self::renderFinderPattern(11, 1, $cellSize);
        $cells .= self::renderFinderPattern(1, 11, $cellSize);

        for ($r = 0; $r < 17; $r++) {
            for ($c = 0; $c < 17; $c++) {
                // Skip finder pattern zones
                if (($r < 7 && $c < 7) || ($r < 7 && $c > 9) || ($r > 9 && $c < 7)) {
                    continue;
                }
                $bit = hexdec($hash[($r * 17 + $c) % 32]) % 2;
                if ($bit === 1) {
                    $x = ($c + 1) * $cellSize;
                    $y = ($r + 1) * $cellSize;
                    $cells .= "<rect x=\"{$x}\" y=\"{$y}\" width=\"{$cellSize}\" height=\"{$cellSize}\" fill=\"#1e293b\" />";
                }
            }
        }

        return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {$size} {$size}\" width=\"{$size}\" height=\"{$size}\" class=\"bg-white p-2 rounded shadow-sm\">\n" .
            "<rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" />\n" .
            $cells .
            "</svg>";
    }

    private static function renderFinderPattern(int $col, int $row, float $cellSize): string
    {
        $x = $col * $cellSize;
        $y = $row * $cellSize;
        $w = 7 * $cellSize;
        
        $out = "<rect x=\"{$x}\" y=\"{$y}\" width=\"{$w}\" height=\"{$w}\" fill=\"#1e293b\" />";
        $x1 = ($col + 1) * $cellSize;
        $y1 = ($row + 1) * $cellSize;
        $w1 = 5 * $cellSize;
        $out .= "<rect x=\"{$x1}\" y=\"{$y1}\" width=\"{$w1}\" height=\"{$w1}\" fill=\"#ffffff\" />";
        $x2 = ($col + 2) * $cellSize;
        $y2 = ($row + 2) * $cellSize;
        $w2 = 3 * $cellSize;
        $out .= "<rect x=\"{$x2}\" y=\"{$y2}\" width=\"{$w2}\" height=\"{$w2}\" fill=\"#1e293b\" />";
        
        return $out;
    }
}
