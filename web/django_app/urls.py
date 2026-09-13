from django.urls import path
from webapp import views

urlpatterns = [
    path("", views.home, name="home"),
    path("guide", views.guide, name="guide"),
    path("rules", views.rules, name="rules"),
    path("examples", views.examples, name="examples"),
    path("mcp-lab", views.mcp_lab, name="mcp_lab"),
    path("studio", views.studio, name="studio"),
    path("about", views.about, name="about"),
    path("run", views.run_action, name="run"),
    path("lint", views.lint_form, name="lint"),
]
