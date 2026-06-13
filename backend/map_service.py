import os

import folium
from folium.plugins import HeatMap
from sqlalchemy.orm import Session

import models


class MapService:
    @staticmethod
    def get_color(severity_category: str) -> str:
        colors = {
            "Low": "green",
            "Medium": "yellow",
            "High": "orange",
            "Critical": "red"
        }
        return colors.get(severity_category, "blue")

    @staticmethod
    def generate_map(db: Session) -> str:
        complaints = db.query(models.Complaint).all()

        center_lat = 20.5937
        center_lon = 78.9629

        if complaints:
            center_lat = sum(c.latitude for c in complaints) / len(complaints)
            center_lon = sum(c.longitude for c in complaints) / len(complaints)

        m = folium.Map(location=[center_lat, center_lon], zoom_start=5)

        for complaint in complaints:
            color = MapService.get_color(complaint.severity_category)

            popup_html = f"""
            <b>Complaint ID:</b> {complaint.id}<br>
            <b>Type:</b> {complaint.damage_type}<br>
            <b>Severity:</b> {complaint.severity_category} ({complaint.severity})<br>
            <b>Priority:</b> {complaint.priority_category} ({complaint.priority})<br>
            <b>Status:</b> {complaint.status}
            """

            folium.CircleMarker(
                location=[complaint.latitude, complaint.longitude],
                radius=8,
                popup=folium.Popup(popup_html, max_width=300),
                color=color,
                fill=True,
                fill_color=color
            ).add_to(m)

        map_path = os.path.join(os.path.dirname(__file__), "map.html")
        m.save(map_path)

        return map_path

    @staticmethod
    def generate_heatmap(db: Session) -> str:
        complaints = db.query(models.Complaint).all()

        center_lat = 20.5937
        center_lon = 78.9629

        if complaints:
            center_lat = sum(c.latitude for c in complaints) / len(complaints)
            center_lon = sum(c.longitude for c in complaints) / len(complaints)

        m = folium.Map(location=[center_lat, center_lon], zoom_start=5)

        heat_data = [
            [c.latitude, c.longitude, c.severity]
            for c in complaints
        ]

        if heat_data:
            HeatMap(heat_data).add_to(m)

        map_path = os.path.join(os.path.dirname(__file__), "heatmap.html")
        m.save(map_path)

        return map_path


map_service = MapService()