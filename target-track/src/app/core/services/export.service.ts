import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Target, LocationPoint } from '../models/target.model';
import { APP_CONSTANTS } from '../../shared/constants/app.constants';

export interface RouteStats {
  totalKm: number;
  avgSpeedKmh: number;
  citiesCount: number;
  durationDays: number;
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  // ── CSV ─────────────────────────────────────────────────────────────────────

  exportCSV(target: Target, filteredHistory: LocationPoint[]): void {
    const headers = [
      'Timestamp',
      'City',
      'State',
      'Latitude',
      'Longitude',
      'Activity',
      'Source',
      'Confidence (%)',
    ];

    const rows = filteredHistory.map(point => [
      point.timestamp,
      point.city,
      point.state,
      point.lat.toFixed(6),
      point.lng.toFixed(6),
      `"${point.activity.replace(/"/g, '""')}"`,
      point.source,
      point.confidence.toString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = `${APP_CONSTANTS.APP_NAME}_${target.alias}_history_${this._dateStamp()}.csv`;
    this._triggerDownload(blob, fileName);
  }

  // ── GeoJSON ─────────────────────────────────────────────────────────────────

  exportGeoJSON(target: Target, filteredHistory: LocationPoint[]): void {
    const features: Array<{
      type: string;
      geometry: { type: string; coordinates: unknown };
      properties: Record<string, unknown>;
    }> = filteredHistory.map(point => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [point.lng, point.lat],
      },
      properties: {
        timestamp: point.timestamp,
        city: point.city,
        state: point.state,
        activity: point.activity,
        source: point.source,
        confidence: point.confidence,
        targetId: target.id,
        targetAlias: target.alias,
      },
    }));

    // Add LineString connecting the trail
    if (filteredHistory.length > 1) {
      features.unshift({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: filteredHistory.map(p => [p.lng, p.lat]),
        },
        properties: {
          type: 'route',
          targetId: target.id,
          targetAlias: target.alias,
          pointsCount: filteredHistory.length,
        },
      });
    }

    const featureCollection = {
      type: 'FeatureCollection' as const,
      metadata: {
        generated: new Date().toISOString(),
        classification: APP_CONSTANTS.CONFIDENTIAL_LABEL,
        targetId: target.id,
        targetAlias: target.alias,
        totalPoints: filteredHistory.length,
      },
      features,
    };

    const blob = new Blob([JSON.stringify(featureCollection, null, 2)], {
      type: 'application/geo+json;charset=utf-8;',
    });
    const fileName = `${APP_CONSTANTS.APP_NAME}_${target.alias}_route_${this._dateStamp()}.geojson`;
    this._triggerDownload(blob, fileName);
  }

  // ── PDF ──────────────────────────────────────────────────────────────────────

  async exportPDF(
    target: Target,
    filteredHistory: LocationPoint[],
    stats: RouteStats
  ): Promise<void> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    // ── Header band ──────────────────────────────────────────────────────────
    doc.setFillColor(183, 28, 28); // #b71c1c
    doc.rect(0, 0, pageWidth, 18, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(APP_CONSTANTS.CONFIDENTIAL_LABEL, pageWidth / 2, 11, { align: 'center' });

    // ── Title ────────────────────────────────────────────────────────────────
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${APP_CONSTANTS.APP_NAME} — Intelligence Report`, margin, 30);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Target: ${target.alias}  (${target.fullName})`,
      margin,
      38
    );

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 44);
    doc.text(`Classification: ${APP_CONSTANTS.CONFIDENTIAL_LABEL}`, margin, 49);

    // ── Target info table ────────────────────────────────────────────────────
    autoTable(doc, {
      startY: 56,
      head: [['Field', 'Value']],
      body: [
        ['Target ID', target.id],
        ['Alias', target.alias],
        ['Full Name', target.fullName],
        ['Category', target.category],
        ['Organization', target.organization],
        ['Threat Level', target.threatLevel],
        ['Status', target.status],
        ['Last Seen', new Date(target.lastSeen).toLocaleString()],
        ['Known Associates', target.knownAssociates.join(', ') || 'None'],
        ['Tags', target.tags.join(', ') || 'None'],
      ],
      headStyles: { fillColor: [25, 118, 210] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
      margin: { left: margin, right: margin },
    });

    // ── Route statistics ─────────────────────────────────────────────────────
    const afterInfoY = (doc as jsPDF & { lastAutoTable: { finalY: number } })
      .lastAutoTable.finalY + 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Route Statistics', margin, afterInfoY);

    autoTable(doc, {
      startY: afterInfoY + 4,
      head: [['Metric', 'Value']],
      body: [
        ['Total Distance', `${stats.totalKm.toFixed(1)} km`],
        ['Average Speed', `${stats.avgSpeedKmh.toFixed(1)} km/h`],
        ['Cities Visited', stats.citiesCount.toString()],
        ['Duration', `${stats.durationDays} day(s)`],
      ],
      headStyles: { fillColor: [25, 118, 210] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
      margin: { left: margin, right: margin },
    });

    // ── Timeline table ────────────────────────────────────────────────────────
    const afterStatsY = (doc as jsPDF & { lastAutoTable: { finalY: number } })
      .lastAutoTable.finalY + 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(`Movement Timeline (${filteredHistory.length} points)`, margin, afterStatsY);

    const timelineRows = filteredHistory.map(p => [
      new Date(p.timestamp).toLocaleString(),
      `${p.city}, ${p.state}`,
      p.activity,
      p.source,
      `${p.confidence}%`,
    ]);

    autoTable(doc, {
      startY: afterStatsY + 4,
      head: [['Timestamp', 'Location', 'Activity', 'Source', 'Confidence']],
      body: timelineRows,
      headStyles: { fillColor: [25, 118, 210] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 36 },
        1: { cellWidth: 30 },
        2: { cellWidth: 68 },
        3: { cellWidth: 22 },
        4: { cellWidth: 16 },
      },
      margin: { left: margin, right: margin },
    });

    // ── Footer on every page ─────────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(183, 28, 28);
      doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255);
      doc.text(
        `${APP_CONSTANTS.CONFIDENTIAL_LABEL}  |  Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 3,
        { align: 'center' }
      );
    }

    const fileName = `${APP_CONSTANTS.APP_NAME}_${target.alias}_report_${this._dateStamp()}.pdf`;
    doc.save(fileName);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private _dateStamp(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private _triggerDownload(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
