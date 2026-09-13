from django.urls import path
from webapp import views

urlpatterns = [
    path("", views.home, name="home"),
    path("run", views.run_action, name="run"),
    path("lint", views.lint_form, name="lint"),
]
